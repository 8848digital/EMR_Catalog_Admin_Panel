const sql = require('mssql');

module.exports = {
    label: 'Manage Category Filter',
    useDatabase: 'yDb',

    getPMCdList: {
        selectClause: `DISTINCT PMCd`,
        from: (dbName) => `[${dbName}].[dbo].[yParam]`,
        whereConditions: ["PTyp = @PTyp", "PMCd LIKE @PMCdPattern"],
        orderByClause: "PMCd",
        inputTypeMap: {
            PTyp: sql.VarChar(50),
            PMCdPattern: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'yFilter',
            PMCdPattern: '%Ctg'
        },
        useDatabase: 'yDb'
    },

    // Get existing filter data for selected PMCd
    getData: {
        selectClause: `
            PTyp,
            PMCd,
            PSCd,
            PDesc,
            PDesc225,
            PValue,
            PNum,
            PValue1,
            PNum1,
            PValue2,
            PValue3,
            PValidYn,
            PPrtKey
        `,
        from: (dbName) => `[${dbName}].[dbo].[yParam]`,
        whereConditions: ["PTyp = @PTyp", "PMCd = @PMCd"],
        orderByClause: "CAST(PValue3 AS INT)",
        inputTypeMap: {
            PTyp: sql.VarChar(50),
            PMCd: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'yFilter'
        },
        useDatabase: 'yDb'
    },

    updateData: {
        validate: (body) => {
            const { PMCd, PSCd, PDesc, PValue3 } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('Category (PMCd) is required');
            }
            if (!PSCd || PSCd.trim() === '') {
                throw new Error('Filter Code (PSCd) is required');
            }
            if (!PDesc || PDesc.trim() === '') {
                throw new Error('Description (PDesc) is required');
            }
            if (!PValue3 || PValue3.trim() === '') {
                throw new Error('PValue3 is required for update');
            }
            return true;
        },

        customUpdate: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PSCd, PDesc, PDesc225, PValue, PNum, PValue1, PNum1, PValue2, PValidYn, PPrtKey, OldPValue3 } = body;

            const trimmedPMCd = PMCd.trim();
            const trimmedPSCd = PSCd.trim();
            const trimmedPDesc = PDesc.trim();
            const trimmedOldPValue3 = OldPValue3.trim();

            // Check for duplicate PSCd in this PMCd (excluding current record)
            const duplicateCheck = await exeQuery(conn, {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.yDb}].[dbo].[yParam]
                    WHERE PTyp = 'yFilter' 
                      AND PMCd = @PMCd 
                      AND PSCd = @PSCd
                      AND PValue3 != @OldPValue3
                `,
                inputTypeMap: {
                    PMCd: sql.VarChar(30),
                    PSCd: sql.VarChar(30),
                    OldPValue3: sql.VarChar(30)
                },
                inputValuesMap: {
                    PMCd: trimmedPMCd,
                    PSCd: trimmedPSCd,
                    OldPValue3: trimmedOldPValue3
                }
            });

            if (duplicateCheck[0]?.Count > 0) {
                throw new Error(`Filter Code "${trimmedPSCd}" already exists in category "${trimmedPMCd}".`);
            }

            const queryStmts = {
                rawQuery: `
                    UPDATE [${process.env.yDb}].[dbo].[yParam]
                    SET 
                        PSCd = @PSCd,
                        PDesc = @PDesc,
                        PDesc225 = @PDesc225,
                        PValue = @PValue,
                        PNum = @PNum,
                        PValue1 = @PValue1,
                        PNum1 = @PNum1,
                        PValue2 = @PValue2,
                        PValidYn = @PValidYn,
                        PPrtKey = @PPrtKey,
                        ModUsr = @ModUsr,
                        ModDt = GETDATE(),
                        ModTime = @ModTime
                    WHERE PTyp = 'yFilter' 
                      AND PMCd = @PMCd
                      AND PValue3 = @PValue3
                `,
                inputTypeMap: {
                    PSCd: sql.VarChar(30),
                    PMCd: sql.VarChar(30),
                    PValue3: sql.VarChar(30),
                    PDesc: sql.VarChar(30),
                    PDesc225: sql.VarChar(225),
                    PValue: sql.VarChar(30),
                    PNum: sql.Float,
                    PValue1: sql.VarChar(120),
                    PNum1: sql.Float,
                    PValue2: sql.VarChar(90),
                    PValidYn: sql.VarChar(1),
                    PPrtKey: sql.VarChar(1),
                    ModUsr: sql.VarChar(5),
                    ModTime: sql.Numeric(5, 2)
                },
                inputValuesMap: {
                    PSCd: trimmedPSCd,
                    PMCd: trimmedPMCd,
                    PValue3: trimmedOldPValue3,
                    PDesc: trimmedPDesc,
                    PDesc225: (PDesc225 || '').trim(),
                    PValue: (PValue || '').trim(),
                    PNum: parseFloat(PNum || 0),
                    PValue1: (PValue1 || '').trim(),
                    PNum1: parseFloat(PNum1 || 0),
                    PValue2: (PValue2 || '').trim(),
                    PValidYn: (PValidYn || ' ').trim(),
                    PPrtKey: (PPrtKey || 'C').trim(),
                    ModUsr: modUsr.substring(0, 5),
                    ModTime: 0.00
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, queryStmts);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Category Filter not found or no changes made');
            }

            return {
                message: 'Category Filter updated successfully',
                PMCd: trimmedPMCd,
                PSCd: trimmedPSCd,
                PDesc: trimmedPDesc,
                PValue3: trimmedOldPValue3
            };
        }
    },

    addData: {
        validate: (body) => {
            const { PMCd, PSCd, PDesc } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('Category (PMCd) is required');
            }
            if (!PSCd || PSCd.trim() === '') {
                throw new Error('Filter Code (PSCd) is required');
            }
            if (!PDesc || PDesc.trim() === '') {
                throw new Error('Description (PDesc) is required');
            }
            return true;
        },

        customAdd: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PSCd, PDesc, PDesc225, PValue, PNum, PValue1, PNum1, PValue2, PValidYn, PPrtKey } = body;

            const trimmedPMCd = PMCd.trim();
            const trimmedPSCd = PSCd.trim();
            const trimmedPDesc = PDesc.trim();

            // Check for duplicate PSCd in this PMCd
            const duplicateCheck = await exeQuery(conn, {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.yDb}].[dbo].[yParam]
                    WHERE PTyp = 'yFilter' 
                      AND PMCd = @PMCd 
                      AND PSCd = @PSCd
                `,
                inputTypeMap: {
                    PMCd: sql.VarChar(30),
                    PSCd: sql.VarChar(30)
                },
                inputValuesMap: {
                    PMCd: trimmedPMCd,
                    PSCd: trimmedPSCd
                }
            });

            if (duplicateCheck[0]?.Count > 0) {
                throw new Error(`Filter Code "${trimmedPSCd}" already exists in category "${trimmedPMCd}".`);
            }

            // Get next PValue3 for this PTyp and PMCd (MAX + 1)
            const getMaxPValue3Query = {
                rawQuery: `
                    SELECT ISNULL(MAX(CAST(PValue3 AS INT)), 0) + 1 AS NextPValue3
                    FROM [${process.env.yDb}].[dbo].[yParam]
                    WHERE PTyp = 'yFilter' AND PMCd = @PMCd
                `,
                inputTypeMap: {
                    PMCd: sql.VarChar(30)
                },
                inputValuesMap: {
                    PMCd: trimmedPMCd
                }
            };

            const maxResult = await exeQuery(conn, getMaxPValue3Query);
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
                    PTyp: 'yFilter',
                    PMCd: trimmedPMCd,
                    PSCd: trimmedPSCd,
                    PDesc: trimmedPDesc,
                    PDesc225: (PDesc225 || ' ').trim(),
                    PValue: (PValue || ' ').trim(),
                    PNum: parseFloat(PNum || 0),
                    PValue1: (PValue1 || ' ').trim(),
                    PNum1: parseFloat(PNum1 || 0),
                    PValue2: (PValue2 || ' ').trim(),
                    ModUsr: modUsr.substring(0, 5),
                    ModTime: 0.00,
                    PValue3: nextPValue3.toString(),
                    PValidYn: (PValidYn || ' ').trim(),
                    PPrtKey: (PPrtKey || 'C').trim()
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, insertQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Failed to add category filter');
            }

            return {
                message: 'Category Filter added successfully',
                PMCd: trimmedPMCd,
                PSCd: trimmedPSCd,
                PDesc: trimmedPDesc,
                PValue3: nextPValue3.toString()
            };
        }
    },

    deleteData: {
        customDelete: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PValue3 } = body;

            if (!PMCd || !PValue3) {
                throw new Error('PMCd and PValue3 are required for deletion');
            }

            const queryStmts = {
                rawQuery: `
                    DELETE FROM [${process.env.yDb}].[dbo].[yParam]
                    WHERE PTyp = 'yFilter' 
                      AND PMCd = @PMCd
                      AND PValue3 = @PValue3
                `,
                inputTypeMap: {
                    PMCd: sql.VarChar(30),
                    PValue3: sql.VarChar(30)
                },
                inputValuesMap: {
                    PMCd: PMCd.trim(),
                    PValue3: PValue3.trim()
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, queryStmts);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Category Filter record not found');
            }

            return {
                message: 'Category Filter deleted successfully'
            };
        }
    }
};