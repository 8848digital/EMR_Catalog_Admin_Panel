const sql = require('mssql');

module.exports = {
    label: 'Manage Button Configuration',

    getData: {
        selectClause: `
            yId,
            CTA,
            HomeScreen,
            HCustSelect,
            HItmSelect,
            HMulItmSelect,
            HStkCart,
            [Transaction],
            CustSearch,
            CustSearchSelect,
            ItemSearch,
            ItemSearchSelect,
            TransactionSearch,
            Checkout,
            CheckoutExit,
            ColHexCd,
            Invoice,
            Entry,
            Closing,
            ClosingValidated,
            HTranSearchJST,
            HTranSearchJMR,
            HTranSearchJMS,
            tranSearchTranSelected,
            Position,
            ModUsr,
            ModDate,
            CreatedUsr,
            CreatedDate
        `,
        from: `[${process.env.yDb}].[dbo].[yPosCTA]`,
        whereConditions: [],
        orderByClause: "CTA",
        inputTypeMap: {},
        inputValuesMap: {}
    },

    updateData: {
        validate: (body) => {
            const { CTA, ColHexCd, Position } = body;

            if (!CTA || CTA.trim() === '') {
                throw new Error('CTA is required');
            }
            if (!ColHexCd || ColHexCd.trim() === '') {
                throw new Error('Color Hex Code is required');
            }
            if (!Position || Position.trim() === '') {
                throw new Error('Position is required');
            }
            return true;
        },

        customUpdate: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const {
                yId,
                CTA,
                HomeScreen,
                HCustSelect,
                HItmSelect,
                HMulItmSelect,
                HStkCart,
                Transaction,
                CustSearch,
                CustSearchSelect,
                ItemSearch,
                ItemSearchSelect,
                TransactionSearch,
                Checkout,
                CheckoutExit,
                ColHexCd,
                Invoice,
                Entry,
                Closing,
                ClosingValidated,
                HTranSearchJST,
                HTranSearchJMR,
                HTranSearchJMS,
                tranSearchTranSelected,
                Position
            } = body;

            // Trim all string values
            const trimmedData = {
                CTA: (CTA || '').trim(),
                HomeScreen: (HomeScreen || '').trim(),
                HCustSelect: (HCustSelect || '').trim(),
                HItmSelect: (HItmSelect || '').trim(),
                HMulItmSelect: (HMulItmSelect || '').trim(),
                HStkCart: (HStkCart || '').trim(),
                Transaction: (Transaction || '').trim(),
                CustSearch: (CustSearch || '').trim(),
                CustSearchSelect: (CustSearchSelect || '').trim(),
                ItemSearch: (ItemSearch || '').trim(),
                ItemSearchSelect: (ItemSearchSelect || '').trim(),
                TransactionSearch: (TransactionSearch || '').trim(),
                Checkout: (Checkout || '').trim(),
                CheckoutExit: (CheckoutExit || '').trim(),
                ColHexCd: (ColHexCd || '').trim(),
                Invoice: (Invoice || '').trim(),
                Entry: (Entry || '').trim(),
                Closing: (Closing || '').trim(),
                ClosingValidated: (ClosingValidated || '').trim(),
                HTranSearchJST: (HTranSearchJST || '').trim(),
                HTranSearchJMR: (HTranSearchJMR || '').trim(),
                HTranSearchJMS: (HTranSearchJMS || '').trim(),
                tranSearchTranSelected: (tranSearchTranSelected || '').trim(),
                Position: (Position || '').trim()
            };

            // Validate: Exactly one screen column should have 'True' or 'False', rest should be 'NA'
            const screenColumns = [
                'HomeScreen', 'HCustSelect', 'HItmSelect', 'HMulItmSelect', 'HStkCart',
                'Transaction', 'CustSearch', 'CustSearchSelect', 'ItemSearch',
                'ItemSearchSelect', 'TransactionSearch', 'Checkout', 'CheckoutExit',
                'Invoice', 'Entry', 'Closing', 'ClosingValidated', 'HTranSearchJST', 'HTranSearchJMR', 'HTranSearchJMS','tranSearchTranSelected'
            ];

            const nonNAColumns = screenColumns.filter(col => {
                const value = trimmedData[col];
                return value && value !== '' && value.toUpperCase() !== 'NA';
            });

            if (nonNAColumns.length === 0) {
                throw new Error('At least one screen column must have a value (True/False)');
            }

            if (nonNAColumns.length > 1) {
                throw new Error('Only one screen column can have a value (True/False). Please set others to NA');
            }

            // Validate that the non-NA value is either 'True' or 'False'
            const activeColumn = nonNAColumns[0];
            const activeValue = trimmedData[activeColumn].toLowerCase();
            if (activeValue !== 'true' && activeValue !== 'false') {
                throw new Error(`${activeColumn} must be either 'True' or 'False'`);
            }

            // Set all other screen columns to 'NA'
            screenColumns.forEach(col => {
                if (col !== activeColumn) {
                    trimmedData[col] = 'NA';
                }
            });

            // Check for duplicate: Same CTA with same screen column having a value
            const checkDuplicateQuery = {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.yDb}].[dbo].[yPosCTA]
                    WHERE CTA = @CTA 
                    AND [${activeColumn}] IN ('True', 'False')
                    AND yId != @yId
                `,
                inputTypeMap: {
                    CTA: sql.VarChar(50),
                    yId: sql.Int
                },
                inputValuesMap: {
                    CTA: trimmedData.CTA,
                    yId: parseInt(yId)
                }
            };

            const duplicateResult = await exeQuery(conn, checkDuplicateQuery);
            if (duplicateResult[0]?.Count > 0) {
                throw new Error(`CTA "${trimmedData.CTA}" with ${activeColumn} already exists. Each CTA can have only one row per screen.`);
            }

            // Update record in yPosCTA
            const updateQuery = {
                rawQuery: `
                    UPDATE [${process.env.yDb}].[dbo].[yPosCTA]
                    SET 
                        CTA = @CTA,
                        HomeScreen = @HomeScreen,
                        HCustSelect = @HCustSelect,
                        HItmSelect = @HItmSelect,
                        HMulItmSelect = @HMulItmSelect,
                        HStkCart = @HStkCart,
                        [Transaction] = @Transaction,
                        CustSearch = @CustSearch,
                        CustSearchSelect = @CustSearchSelect,
                        ItemSearch = @ItemSearch,
                        ItemSearchSelect = @ItemSearchSelect,
                        TransactionSearch = @TransactionSearch,
                        Checkout = @Checkout,
                        CheckoutExit = @CheckoutExit,
                        ColHexCd = @ColHexCd,
                        Invoice = @Invoice,
                        Entry = @Entry,
                        Closing = @Closing,
                        ClosingValidated = @ClosingValidated,
                        HTranSearchJST = @HTranSearchJST,
                        HTranSearchJMR = @HTranSearchJMR, 
                        HTranSearchJMS = @HTranSearchJMS,
                        tranSearchTranSelected = @tranSearchTranSelected,
                        Position = @Position,
                        ModUsr = @ModUsr,
                        ModDate = GETDATE()
                    WHERE yId = @yId
                `,
                inputTypeMap: {
                    yId: sql.Int,
                    CTA: sql.VarChar(50),
                    HomeScreen: sql.VarChar(50),
                    HCustSelect: sql.VarChar(50),
                    HItmSelect: sql.VarChar(50),
                    HMulItmSelect: sql.VarChar(50),
                    HStkCart: sql.VarChar(50),
                    Transaction: sql.VarChar(50),
                    CustSearch: sql.VarChar(50),
                    CustSearchSelect: sql.VarChar(50),
                    ItemSearch: sql.VarChar(50),
                    ItemSearchSelect: sql.VarChar(50),
                    TransactionSearch: sql.VarChar(50),
                    Checkout: sql.VarChar(50),
                    CheckoutExit: sql.VarChar(50),
                    ColHexCd: sql.VarChar(50),
                    Invoice: sql.VarChar(50),
                    Entry: sql.VarChar(50),
                    Closing: sql.VarChar(50),
                    ClosingValidated: sql.VarChar(50),
                    HTranSearchJST: sql.VarChar(50),
                    HTranSearchJMR: sql.VarChar(50),
                    HTranSearchJMS: sql.VarChar(50),
                    tranSearchTranSelected: sql.VarChar(50),
                    Position: sql.VarChar(50),
                    ModUsr: sql.VarChar(50)
                },
                inputValuesMap: {
                    yId: parseInt(yId),
                    CTA: trimmedData.CTA,
                    HomeScreen: trimmedData.HomeScreen,
                    HCustSelect: trimmedData.HCustSelect,
                    HItmSelect: trimmedData.HItmSelect,
                    HMulItmSelect: trimmedData.HMulItmSelect,
                    HStkCart: trimmedData.HStkCart,
                    Transaction: trimmedData.Transaction,
                    CustSearch: trimmedData.CustSearch,
                    CustSearchSelect: trimmedData.CustSearchSelect,
                    ItemSearch: trimmedData.ItemSearch,
                    ItemSearchSelect: trimmedData.ItemSearchSelect,
                    TransactionSearch: trimmedData.TransactionSearch,
                    Checkout: trimmedData.Checkout,
                    CheckoutExit: trimmedData.CheckoutExit,
                    ColHexCd: trimmedData.ColHexCd,
                    Invoice: trimmedData.Invoice,
                    Entry: trimmedData.Entry,
                    Closing: trimmedData.Closing,
                    ClosingValidated: trimmedData.ClosingValidated,
                    HTranSearchJST: trimmedData.HTranSearchJST,
                    HTranSearchJMR: trimmedData.HTranSearchJMR,
                    HTranSearchJMS: trimmedData.HTranSearchJMS,
                    tranSearchTranSelected: trimmedData.tranSearchTranSelected,
                    Position: trimmedData.Position,
                    ModUsr: modUsr.substring(0, 50)
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, updateQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Button Configuration not found or no changes made');
            }

            return {
                message: 'Button Configuration updated successfully',
                yId: yId,
                CTA: trimmedData.CTA
            };
        }
    },

    addData: {
        validate: (body) => {
            const { CTA, ColHexCd, Position } = body;

            if (!CTA || CTA.trim() === '') {
                throw new Error('CTA is required');
            }
            if (!ColHexCd || ColHexCd.trim() === '') {
                throw new Error('Color Hex Code is required');
            }
            if (!Position || Position.trim() === '') {
                throw new Error('Position is required');
            }
            return true;
        },

        customAdd: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const {
                CTA,
                HomeScreen,
                HCustSelect,
                HItmSelect,
                HMulItmSelect,
                HStkCart,
                Transaction,
                CustSearch,
                CustSearchSelect,
                ItemSearch,
                ItemSearchSelect,
                TransactionSearch,
                Checkout,
                CheckoutExit,
                ColHexCd,
                Invoice,
                Entry,
                Closing,
                ClosingValidated,
                HTranSearchJST,
                HTranSearchJMR,
                HTranSearchJMS,
                tranSearchTranSelected,
                Position
            } = body;

            // Trim all string values
            const trimmedData = {
                CTA: (CTA || '').trim(),
                HomeScreen: (HomeScreen || '').trim(),
                HCustSelect: (HCustSelect || '').trim(),
                HItmSelect: (HItmSelect || '').trim(),
                HMulItmSelect: (HMulItmSelect || '').trim(),
                HStkCart: (HStkCart || '').trim(),
                Transaction: (Transaction || '').trim(),
                CustSearch: (CustSearch || '').trim(),
                CustSearchSelect: (CustSearchSelect || '').trim(),
                ItemSearch: (ItemSearch || '').trim(),
                ItemSearchSelect: (ItemSearchSelect || '').trim(),
                TransactionSearch: (TransactionSearch || '').trim(),
                Checkout: (Checkout || '').trim(),
                CheckoutExit: (CheckoutExit || '').trim(),
                ColHexCd: (ColHexCd || '').trim(),
                Invoice: (Invoice || '').trim(),
                Entry: (Entry || '').trim(),
                Closing: (Closing || '').trim(),
                ClosingValidated: (ClosingValidated || '').trim(),
                HTranSearchJST: (HTranSearchJST || '').trim(),
                HTranSearchJMR: (HTranSearchJMR || '').trim(),
                HTranSearchJMS: (HTranSearchJMS || '').trim(),
                tranSearchTranSelected: (tranSearchTranSelected || '').trim(),
                Position: (Position || '').trim()
            };

            // Validate: Exactly one screen column should have 'True' or 'False', rest should be 'NA'
            const screenColumns = [
                'HomeScreen', 'HCustSelect', 'HItmSelect', 'HMulItmSelect', 'HStkCart',
                'Transaction', 'CustSearch', 'CustSearchSelect', 'ItemSearch',
                'ItemSearchSelect', 'TransactionSearch', 'Checkout', 'CheckoutExit',
                'Invoice', 'Entry', 'Closing', 'ClosingValidated', 'HTranSearchJST', 'HTranSearchJMR', 'HTranSearchJMS', 'tranSearchTranSelected'
            ];

            const nonNAColumns = screenColumns.filter(col => {
                const value = trimmedData[col];
                return value && value !== '' && value.toUpperCase() !== 'NA';
            });

            if (nonNAColumns.length === 0) {
                throw new Error('At least one screen column must have a value (True/False)');
            }

            if (nonNAColumns.length > 1) {
                throw new Error('Only one screen column can have a value (True/False). Please set others to NA');
            }

            // Validate that the non-NA value is either 'True' or 'False'
            const activeColumn = nonNAColumns[0];
            const activeValue = trimmedData[activeColumn].toLowerCase();
            if (activeValue !== 'true' && activeValue !== 'false') {
                throw new Error(`${activeColumn} must be either 'True' or 'False'`);
            }

            // Set all other screen columns to 'NA'
            screenColumns.forEach(col => {
                if (col !== activeColumn) {
                    trimmedData[col] = 'NA';
                }
            });

            // Check for duplicate: Same CTA with same screen column having a value
            const checkDuplicateQuery = {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.yDb}].[dbo].[yPosCTA]
                    WHERE CTA = @CTA 
                    AND [${activeColumn}] IN ('True', 'False')
                `,
                inputTypeMap: {
                    CTA: sql.VarChar(50)
                },
                inputValuesMap: {
                    CTA: trimmedData.CTA
                }
            };

            const duplicateResult = await exeQuery(conn, checkDuplicateQuery);
            if (duplicateResult[0]?.Count > 0) {
                throw new Error(`CTA "${trimmedData.CTA}" with ${activeColumn} already exists. Each CTA can have only one row per screen.`);
            }

            const insertQuery = {
                rawQuery: `
                    INSERT INTO [${process.env.yDb}].[dbo].[yPosCTA]
                    (CTA, HomeScreen, HCustSelect, HItmSelect, HMulItmSelect, HStkCart, 
                     [Transaction], CustSearch, CustSearchSelect, ItemSearch, ItemSearchSelect, 
                     TransactionSearch, Checkout, CheckoutExit, ColHexCd, Invoice, Entry, 
                     Closing, ClosingValidated, HTranSearchJST, HTranSearchJMR, HTranSearchJMS,tranSearchTranSelected, Position, ModUsr, ModDate, CreatedUsr, CreatedDate)
                    VALUES 
                    (@CTA, @HomeScreen, @HCustSelect, @HItmSelect, @HMulItmSelect, @HStkCart,
                     @Transaction, @CustSearch, @CustSearchSelect, @ItemSearch, @ItemSearchSelect,
                     @TransactionSearch, @Checkout, @CheckoutExit, @ColHexCd, @Invoice, @Entry,
                     @Closing, @ClosingValidated, @HTranSearchJST, @HTranSearchJMR, @HTranSearchJMS, @tranSearchTranSelected, @Position, @ModUsr, GETDATE(), @CreatedUsr, GETDATE())
                `,
                inputTypeMap: {
                    CTA: sql.VarChar(50),
                    HomeScreen: sql.VarChar(50),
                    HCustSelect: sql.VarChar(50),
                    HItmSelect: sql.VarChar(50),
                    HMulItmSelect: sql.VarChar(50),
                    HStkCart: sql.VarChar(50),
                    Transaction: sql.VarChar(50),
                    CustSearch: sql.VarChar(50),
                    CustSearchSelect: sql.VarChar(50),
                    ItemSearch: sql.VarChar(50),
                    ItemSearchSelect: sql.VarChar(50),
                    TransactionSearch: sql.VarChar(50),
                    Checkout: sql.VarChar(50),
                    CheckoutExit: sql.VarChar(50),
                    ColHexCd: sql.VarChar(50),
                    Invoice: sql.VarChar(50),
                    Entry: sql.VarChar(50),
                    Closing: sql.VarChar(50),
                    ClosingValidated: sql.VarChar(50),
                    HTranSearchJST: sql.VarChar(50),
                    HTranSearchJMR: sql.VarChar(50),
                    HTranSearchJMS: sql.VarChar(50),
                    tranSearchTranSelected: sql.VarChar(50),
                    Position: sql.VarChar(50),
                    ModUsr: sql.VarChar(50),
                    CreatedUsr: sql.VarChar(50)
                },
                inputValuesMap: {
                    CTA: trimmedData.CTA,
                    HomeScreen: trimmedData.HomeScreen,
                    HCustSelect: trimmedData.HCustSelect,
                    HItmSelect: trimmedData.HItmSelect,
                    HMulItmSelect: trimmedData.HMulItmSelect,
                    HStkCart: trimmedData.HStkCart,
                    Transaction: trimmedData.Transaction,
                    CustSearch: trimmedData.CustSearch,
                    CustSearchSelect: trimmedData.CustSearchSelect,
                    ItemSearch: trimmedData.ItemSearch,
                    ItemSearchSelect: trimmedData.ItemSearchSelect,
                    TransactionSearch: trimmedData.TransactionSearch,
                    Checkout: trimmedData.Checkout,
                    CheckoutExit: trimmedData.CheckoutExit,
                    ColHexCd: trimmedData.ColHexCd,
                    Invoice: trimmedData.Invoice,
                    Entry: trimmedData.Entry,
                    Closing: trimmedData.Closing,
                    ClosingValidated: trimmedData.ClosingValidated,
                    HTranSearchJST: trimmedData.HTranSearchJST,
                    HTranSearchJMR: trimmedData.HTranSearchJMR,
                    HTranSearchJMS: trimmedData.HTranSearchJMS,
                    tranSearchTranSelected: trimmedData.tranSearchTranSelected,
                    Position: trimmedData.Position,
                    ModUsr: modUsr.substring(0, 50),
                    CreatedUsr: modUsr.substring(0, 50)
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, insertQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Failed to add Button Configuration');
            }

            return {
                message: 'Button Configuration added successfully',
                CTA: trimmedData.CTA
            };
        }
    },

    deleteData: {
        customDelete: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { yId } = body;

            if (!yId) {
                throw new Error('yId is required for deletion');
            }

            const deleteQuery = {
                rawQuery: `
                    DELETE FROM [${process.env.yDb}].[dbo].[yPosCTA]
                    WHERE yId = @yId
                `,
                inputTypeMap: {
                    yId: sql.Int
                },
                inputValuesMap: {
                    yId: parseInt(yId)
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, deleteQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Button Configuration not found');
            }

            return {
                message: 'Button Configuration deleted successfully'
            };
        }
    }
};