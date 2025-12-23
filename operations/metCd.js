const sql = require('mssql');

module.exports = {
    label: 'Manage Metal Code',

    getData: {
        selectClause: `
            PTyp,
            PMCd,
            PDesc,
            PDesc225,
            PValue3
        `,
        from: `[${process.env.yDb}].[dbo].[yParam]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "CAST(PValue3 AS INT)",
        inputTypeMap: {
            PTyp: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'yMetCd'
        }
    },

    updateData: {
        validate: (body) => {
            const { PMCd, PDesc, PDesc225 } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('Metal Code (PMCd) is required');
            }
            if (!PDesc || PDesc.trim() === '') {
                throw new Error('Short Description (PDesc) is required');
            }
            if (!PDesc225 || PDesc225.trim() === '') {
                throw new Error('Description (PDesc225) is required');
            }
            return true;
        },

        customUpdate: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PDesc, PDesc225, OldPMCd } = body;

            const newPMCd = PMCd.trim();
            const newPDesc = PDesc.trim();
            const newPDesc225 = PDesc225.trim();
            const oldPMCd = (OldPMCd || '').trim();

            const isPMCdChanged = newPMCd !== oldPMCd;

            // Check for duplicate PMCd if changed
            if (isPMCdChanged) {
                const checkDuplicateQuery = {
                    rawQuery: `
                        SELECT COUNT(*) as Count
                        FROM [${process.env.yDb}].[dbo].[yParam]
                        WHERE PTyp = 'yMetCd' 
                          AND PMCd = @NewPMCd
                    `,
                    inputTypeMap: {
                        NewPMCd: sql.VarChar(30)
                    },
                    inputValuesMap: {
                        NewPMCd: newPMCd
                    }
                };

                const duplicateResult = await exeQuery(conn, checkDuplicateQuery);
                if (duplicateResult[0]?.Count > 0) {
                    throw new Error(`Metal Code "${newPMCd}" already exists`);
                }
            }

            // Update record in 8848EmrKc
            const updateQuery = {
                rawQuery: `
                    UPDATE [${process.env.yDb}].[dbo].[yParam]
                    SET 
                        PMCd = @NewPMCd,
                        PDesc = @NewPDesc,
                        PDesc225 = @NewPDesc225,
                        ModUsr = @ModUsr,
                        ModDt = GETDATE(),
                        ModTime = @ModTime
                    WHERE PTyp = 'yMetCd'
                      AND PMCd = @OldPMCd
                `,
                inputTypeMap: {
                    NewPMCd: sql.VarChar(30),
                    NewPDesc: sql.VarChar(30),
                    NewPDesc225: sql.VarChar(225),
                    OldPMCd: sql.VarChar(30),
                    ModUsr: sql.VarChar(5),
                    ModTime: sql.Numeric(5, 2)
                },
                inputValuesMap: {
                    NewPMCd: newPMCd,
                    NewPDesc: newPDesc,
                    NewPDesc225: newPDesc225,
                    OldPMCd: oldPMCd,
                    ModUsr: modUsr.substring(0, 5),
                    ModTime: 0.00
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, updateQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Metal Code not found or no changes made');
            }

            return {
                message: 'Metal Code updated successfully',
                PMCd: newPMCd,
                PDesc: newPDesc,
                PDesc225: newPDesc225
            };
        }
    },

    addData: {
        validate: (body) => {
            const { PMCd, PDesc, PDesc225 } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('Metal Code (PMCd) is required');
            }
            if (!PDesc || PDesc.trim() === '') {
                throw new Error('Short Description (PDesc) is required');
            }
            if (!PDesc225 || PDesc225.trim() === '') {
                throw new Error('Description (PDesc225) is required');
            }
            return true;
        },

        customAdd: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PDesc, PDesc225 } = body;

            const trimmedPMCd = PMCd.trim();
            const trimmedPDesc = PDesc.trim();
            const trimmedPDesc225 = PDesc225.trim();

            const checkDuplicateQuery = {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.yDb}].[dbo].[yParam]
                    WHERE PTyp = 'yMetCd' 
                      AND PMCd = @PMCd
                `,
                inputTypeMap: {
                    PMCd: sql.VarChar(30)
                },
                inputValuesMap: {
                    PMCd: trimmedPMCd
                }
            };

            const duplicateResult = await exeQuery(conn, checkDuplicateQuery);
            if (duplicateResult[0]?.Count > 0) {
                throw new Error(`Metal Code "${trimmedPMCd}" already exists`);
            }

            const getPValue3Query = {
                rawQuery: `
                    SELECT ISNULL(MAX(CAST(PValue3 AS INT)), 0) + 1 AS NextPValue3
                    FROM [${process.env.yDb}].[dbo].[yParam]
                    WHERE PTyp = 'yMetCd'
                `,
                inputTypeMap: {},
                inputValuesMap: {}
            };

            const maxResult = await exeQuery(conn, getPValue3Query);
            const nextPValue3 = maxResult[0]?.NextPValue3 || 1;

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
                    PTyp: 'yMetCd',
                    PMCd: trimmedPMCd,
                    PSCd: '',
                    PDesc: trimmedPDesc,
                    PDesc225: trimmedPDesc225,
                    PValue: '',
                    PNum: 0,
                    PValue1: '',
                    PNum1: 0,
                    PValue2: '',
                    ModUsr: modUsr.substring(0, 5),
                    ModTime: 0.00,
                    PValue3: nextPValue3.toString(),
                    PValidYn: '',
                    PPrtKey: 'C'
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, insertQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Failed to add Metal Code');
            }

            return {
                message: 'Metal Code added successfully',
                PMCd: trimmedPMCd,
                PDesc: trimmedPDesc,
                PDesc225: trimmedPDesc225,
                PValue3: nextPValue3.toString()
            };
        }
    },

    deleteData: {
        customDelete: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd } = body;

            if (!PMCd) {
                throw new Error('PMCd is required for deletion');
            }

            const deleteQuery = {
                rawQuery: `
                    DELETE FROM [${process.env.yDb}].[dbo].[yParam]
                    WHERE PTyp = 'yMetCd' 
                      AND PMCd = @PMCd
                `,
                inputTypeMap: {
                    PMCd: sql.VarChar(30)
                },
                inputValuesMap: {
                    PMCd: PMCd.trim()
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, deleteQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Metal Code not found');
            }

            return {
                message: 'Metal Code deleted successfully'
            };
        }
    }
};