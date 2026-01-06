const sql = require('mssql');

module.exports = {
    label: 'Manage Customer Mapping',

    getPMCdList: {
        selectClause: `
            usr.PMCd
        `,
        from: `[${process.env.DB_DATABASE}].[dbo].[Param] sp
               JOIN [${process.env.DB_DATABASE}].[dbo].[Param] usr
                 ON sp.PDesc = usr.PDesc`,
        whereConditions: ["sp.PTyp = @SPTyp", "usr.PTyp = @USRTyp"],
        orderByClause: "usr.PMCd",
        inputTypeMap: {
            SPTyp: sql.VarChar(50),
            USRTyp: sql.VarChar(50)
        },
        inputValuesMap: {
            SPTyp: 'SP',
            USRTyp: 'USR'
        }
    },

    getPSCdList: {
        selectClause: `
            CmCd
        `,
        from: `[${process.env.DB_DATABASE}].[dbo].[CustMst]`,
        whereConditions: [],
        orderByClause: "CmCd",
        inputTypeMap: {},
        inputValuesMap: {}
    },

    getData: {
        selectClause: `
            PTyp,
            PMCd,
            PSCd
        `,
        from: `[${process.env.yDb}].[dbo].[yParam]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "PMCd, PSCd",
        inputTypeMap: {
            PTyp: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'yCustMp'
        }
    },

    updateData: {
        validate: (body) => {
            const { PMCd, PSCd } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('Sales Person Code (PMCd) is required');
            }
            if (!PSCd || PSCd.trim() === '') {
                throw new Error('Customer Code (PSCd) is required');
            }
            return true;
        },

        customUpdate: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PSCd, OldPMCd, OldPSCd } = body;

            const newPMCd = PMCd.trim();
            const newPSCd = PSCd.trim();
            const oldPMCd = (OldPMCd || '').trim();
            const oldPSCd = (OldPSCd || '').trim();

            const isPMCdChanged = newPMCd !== oldPMCd;
            const isPSCdChanged = newPSCd !== oldPSCd;

            // Validate PMCd exists in sales person list
            if (isPMCdChanged) {
                const checkSalesPersonQuery = {
                    rawQuery: `
                        SELECT COUNT(*) as Count
                        FROM [${process.env.DB_DATABASE}].[dbo].[Param] sp
                        JOIN [${process.env.DB_DATABASE}].[dbo].[Param] usr
                          ON sp.PDesc = usr.PDesc
                        WHERE sp.PTyp = 'SP' 
                          AND usr.PTyp = 'USR'
                          AND usr.PMCd = @PMCd
                    `,
                    inputTypeMap: {
                        PMCd: sql.VarChar(30)
                    },
                    inputValuesMap: {
                        PMCd: newPMCd
                    }
                };

                const salesPersonResult = await exeQuery(conn, checkSalesPersonQuery);
                if (salesPersonResult[0]?.Count === 0) {
                    throw new Error(`Sales Person Code "${newPMCd}" does not exist in valid sales persons`);
                }
            }

            // Validate PSCd exists in KC CustMst table
            if (isPSCdChanged) {
                const checkCustomerQuery = {
                    rawQuery: `
                        SELECT COUNT(*) as Count
                        FROM [${process.env.DB_DATABASE}].[dbo].[CustMst]
                        WHERE CmCd = @PSCd
                    `,
                    inputTypeMap: {
                        PSCd: sql.VarChar(30)
                    },
                    inputValuesMap: {
                        PSCd: newPSCd
                    }
                };

                const customerResult = await exeQuery(conn, checkCustomerQuery);
                if (customerResult[0]?.Count === 0) {
                    throw new Error(`Customer Code "${newPSCd}" does not exist in CustMst table`);
                }
            }

            const isChanged = newPMCd !== oldPMCd || newPSCd !== oldPSCd;

            if (isChanged) {
                const checkDuplicateQuery = {
                    rawQuery: `
                        SELECT COUNT(*) as Count
                        FROM [${process.env.yDb}].[dbo].[yParam]
                        WHERE PTyp = 'yCustMp' 
                          AND PSCd = @NewPSCd
                          AND NOT (PMCd = @OldPMCd AND PSCd = @OldPSCd)
                    `,
                    inputTypeMap: {
                        NewPSCd: sql.VarChar(30),
                        OldPMCd: sql.VarChar(30),
                        OldPSCd: sql.VarChar(30)
                    },
                    inputValuesMap: {
                        NewPSCd: newPSCd,
                        OldPMCd: oldPMCd,
                        OldPSCd: oldPSCd
                    }
                };

                const duplicateResult = await exeQuery(conn, checkDuplicateQuery);
                if (duplicateResult[0]?.Count > 0) {
                    throw new Error(`Customer Code "${newPSCd}" is already mapped to another sales person`);
                }
            }

            const updateQuery = {
                rawQuery: `
                    UPDATE [${process.env.yDb}].[dbo].[yParam]
                    SET 
                        PMCd = @NewPMCd,
                        PSCd = @NewPSCd,
                        ModUsr = @ModUsr,
                        ModDt = GETDATE(),
                        ModTime = @ModTime
                    WHERE PTyp = 'yCustMp'
                      AND PMCd = @OldPMCd 
                      AND PSCd = @OldPSCd
                `,
                inputTypeMap: {
                    NewPMCd: sql.VarChar(30),
                    NewPSCd: sql.VarChar(30),
                    OldPMCd: sql.VarChar(30),
                    OldPSCd: sql.VarChar(30),
                    ModUsr: sql.VarChar(5),
                    ModTime: sql.Numeric(5, 2)
                },
                inputValuesMap: {
                    NewPMCd: newPMCd,
                    NewPSCd: newPSCd,
                    OldPMCd: oldPMCd,
                    OldPSCd: oldPSCd,
                    ModUsr: modUsr.substring(0, 5),
                    ModTime: 0.00
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, updateQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Customer mapping not found or no changes made');
            }

            return {
                message: 'Customer mapping updated successfully',
                PMCd: newPMCd,
                PSCd: newPSCd
            };
        }
    },

    addData: {
        validate: (body) => {
            const { PMCd, PSCd } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('Sales Person Code (PMCd) is required');
            }
            if (!PSCd || PSCd.trim() === '') {
                throw new Error('Customer Code (PSCd) is required');
            }
            return true;
        },

        customAdd: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PSCd } = body;

            const trimmedPMCd = PMCd.trim();
            const trimmedPSCd = PSCd.trim();

            // Validate PMCd exists in sales person list
            const checkSalesPersonQuery = {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.DB_DATABASE}].[dbo].[Param] sp
                    JOIN [${process.env.DB_DATABASE}].[dbo].[Param] usr
                      ON sp.PDesc = usr.PDesc
                    WHERE sp.PTyp = 'SP' 
                      AND usr.PTyp = 'USR'
                      AND usr.PMCd = @PMCd
                `,
                inputTypeMap: {
                    PMCd: sql.VarChar(30)
                },
                inputValuesMap: {
                    PMCd: trimmedPMCd
                }
            };

            const salesPersonResult = await exeQuery(conn, checkSalesPersonQuery);
            if (salesPersonResult[0]?.Count === 0) {
                throw new Error(`Sales Person Code "${trimmedPMCd}" does not exist in valid sales persons`);
            }

            // Validate PSCd exists in KC CustMst table
            const checkCustomerQuery = {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.DB_DATABASE}].[dbo].[CustMst]
                    WHERE CmCd = @PSCd
                `,
                inputTypeMap: {
                    PSCd: sql.VarChar(30)
                },
                inputValuesMap: {
                    PSCd: trimmedPSCd
                }
            };

            const customerResult = await exeQuery(conn, checkCustomerQuery);
            if (customerResult[0]?.Count === 0) {
                throw new Error(`Customer Code "${trimmedPSCd}" does not exist in CustMst table`);
            }

            // Check if PSCd is already mapped
            const checkDuplicateQuery = {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.yDb}].[dbo].[yParam]
                    WHERE PTyp = 'yCustMp' 
                      AND PSCd = @PSCd
                `,
                inputTypeMap: {
                    PSCd: sql.VarChar(30)
                },
                inputValuesMap: {
                    PSCd: trimmedPSCd
                }
            };

            const duplicateResult = await exeQuery(conn, checkDuplicateQuery);
            if (duplicateResult[0]?.Count > 0) {
                throw new Error(`Customer Code "${trimmedPSCd}" is already mapped to another sales person`);
            }

            // Generate PValue3
            const getPValue3Query = {
                rawQuery: `
                    SELECT ISNULL(MAX(CAST(PValue3 AS INT)), 0) + 1 AS NextPValue3
                    FROM [${process.env.yDb}].[dbo].[yParam]
                    WHERE PTyp = 'yCustMp'
                `,
                inputTypeMap: {},
                inputValuesMap: {}
            };

            const maxResult = await exeQuery(conn, getPValue3Query);
            const nextPValue3 = maxResult[0]?.NextPValue3 || 1;

            // Insert new record
            const insertQuery = {
                rawQuery: `
                    INSERT INTO [${process.env.yDb}].[dbo].[yParam]
                    (PTyp, PMCd, PSCd, PDesc, PDesc225, PValue, PNum, PValue1, PNum1, PValue2, 
                     ModUsr, ModDt, ModTime, PValue3, PValidYn, PPrtKey)
                    VALUES 
                    (@PTyp, @PMCd, @PSCd, @PDesc, @PDesc225, @PValue, @PNum, @PValue1, @PNum1, @PValue2,
                     @ModUsr, GETDATE(), @ModTime, @PValue3, @PValidYn, @PPrtKey)
                `,
                inputTypeMap: {
                    PTyp: sql.VarChar(20),
                    PMCd: sql.VarChar(30),
                    PSCd: sql.VarChar(30),
                    PDesc: sql.VarChar(30),
                    PDesc225: sql.VarChar(225),
                    PValue: sql.VarChar(30),
                    PNum: sql.Float,
                    PValue1: sql.VarChar(120),
                    PNum1: sql.Float,
                    PValue2: sql.VarChar(90),
                    ModUsr: sql.VarChar(5),
                    ModTime: sql.Numeric(5, 2),
                    PValue3: sql.VarChar(30),
                    PValidYn: sql.VarChar(1),
                    PPrtKey: sql.VarChar(1)
                },
                inputValuesMap: {
                    PTyp: 'yCustMp',
                    PMCd: trimmedPMCd,
                    PSCd: trimmedPSCd,
                    PDesc: '',
                    PDesc225: '',
                    PValue: '',
                    PNum: 0,
                    PValue1: '',
                    PNum1: 0,
                    PValue2: '',
                    ModUsr: modUsr.substring(0, 5),
                    ModTime: 0.00,
                    PValue3: nextPValue3.toString(),
                    PValidYn: '',
                    PPrtKey: ''
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, insertQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Failed to add customer mapping');
            }

            return {
                message: 'Customer mapping added successfully',
                PMCd: trimmedPMCd,
                PSCd: trimmedPSCd,
                PValue3: nextPValue3.toString()
            };
        }
    },

    deleteData: {
        customDelete: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PSCd } = body;

            if (!PMCd || !PSCd) {
                throw new Error('PMCd and PSCd are required for deletion');
            }

            const deleteQuery = {
                rawQuery: `
                    DELETE FROM [${process.env.yDb}].[dbo].[yParam]
                    WHERE PTyp = 'yCustMp' 
                      AND PMCd = @PMCd 
                      AND PSCd = @PSCd
                `,
                inputTypeMap: {
                    PMCd: sql.VarChar(30),
                    PSCd: sql.VarChar(30)
                },
                inputValuesMap: {
                    PMCd: PMCd.trim(),
                    PSCd: PSCd.trim()
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, deleteQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Customer mapping not found');
            }

            return {
                message: 'Customer mapping deleted successfully'
            };
        }
    }
};