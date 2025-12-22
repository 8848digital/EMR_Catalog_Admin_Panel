const sql = require('mssql');

module.exports = {
    label: 'Manage Metal Purity',
    useDatabase: 'yDbKc', 

    getPMCdList: {
        selectClause: `
            PMCd
        `,
        from: (dbName) => `[${dbName}].[dbo].[yParam]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "PMCd",
        inputTypeMap: {
            PTyp: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'yMetCd'
        },
        useDatabase: 'yDbKc'  
    },

    getData: {
        selectClause: `
            PTyp,
            PMCd,
            PSCd,
            PDesc,
            PValue,
            PValue3
        `,
        from: (dbName) => `[${dbName}].[dbo].[yParam]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "PMCd, PSCd",
        inputTypeMap: {
            PTyp: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'yMetKt'
        },
        useDatabase: 'yDbKc'
    },

    updateData: {
        validate: (body) => {
            const { PMCd, PSCd, PDesc, PValue } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('Metal Code (PMCd) is required');
            }
            if (!PSCd || PSCd.trim() === '') {
                throw new Error('Purity Code (PSCd) is required');
            }
            if (!PDesc || PDesc.trim() === '') {
                throw new Error('Description (PDesc) is required');
            }
            if (!PValue || PValue.trim() === '') {
                throw new Error('Purity Value (PValue) is required');
            }
            return true;
        },

        customUpdate: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PSCd, PDesc, PValue, OldPMCd, OldPSCd } = body;

            const newPMCd = PMCd.trim();
            const newPSCd = PSCd.trim();
            const newPDesc = PDesc.trim();
            const newPValue = PValue.trim();
            const oldPMCd = (OldPMCd || '').trim();
            const oldPSCd = (OldPSCd || '').trim();

            const isChanged = newPMCd !== oldPMCd || newPSCd !== oldPSCd;

            if (isChanged) {
                const checkDuplicateQuery = {
                    rawQuery: `
                        SELECT COUNT(*) as Count
                        FROM [${process.env.yDbKc}].[dbo].[yParam]
                        WHERE PTyp = 'yMetKt' 
                          AND PMCd = @NewPMCd
                          AND PSCd = @NewPSCd
                          AND NOT (PMCd = @OldPMCd AND PSCd = @OldPSCd)
                    `,
                    inputTypeMap: {
                        NewPMCd: sql.VarChar(30),
                        NewPSCd: sql.VarChar(30),
                        OldPMCd: sql.VarChar(30),
                        OldPSCd: sql.VarChar(30)
                    },
                    inputValuesMap: {
                        NewPMCd: newPMCd,
                        NewPSCd: newPSCd,
                        OldPMCd: oldPMCd,
                        OldPSCd: oldPSCd
                    }
                };

                const duplicateResult = await exeQuery(conn, checkDuplicateQuery);
                if (duplicateResult[0]?.Count > 0) {
                    throw new Error(`Metal Purity combination "${newPMCd}" - "${newPSCd}" already exists`);
                }
            }

            const updateQuery = {
                rawQuery: `
                    UPDATE [${process.env.yDbKc}].[dbo].[yParam]
                    SET 
                        PMCd = @NewPMCd,
                        PSCd = @NewPSCd,
                        PDesc = @NewPDesc,
                        PValue = @NewPValue,
                        ModUsr = @ModUsr,
                        ModDt = GETDATE(),
                        ModTime = @ModTime
                    WHERE PTyp = 'yMetKt'
                      AND PMCd = @OldPMCd 
                      AND PSCd = @OldPSCd
                `,
                inputTypeMap: {
                    NewPMCd: sql.VarChar(30),
                    NewPSCd: sql.VarChar(30),
                    NewPDesc: sql.VarChar(30),
                    NewPValue: sql.VarChar(30),
                    OldPMCd: sql.VarChar(30),
                    OldPSCd: sql.VarChar(30),
                    ModUsr: sql.VarChar(5),
                    ModTime: sql.Numeric(5, 2)
                },
                inputValuesMap: {
                    NewPMCd: newPMCd,
                    NewPSCd: newPSCd,
                    NewPDesc: newPDesc,
                    NewPValue: newPValue,
                    OldPMCd: oldPMCd,
                    OldPSCd: oldPSCd,
                    ModUsr: modUsr.substring(0, 5),
                    ModTime: 0.00
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, updateQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Metal Purity not found or no changes made');
            }

            return {
                message: 'Metal Purity updated successfully',
                PMCd: newPMCd,
                PSCd: newPSCd,
                PDesc: newPDesc,
                PValue: newPValue
            };
        }
    },

    addData: {
        validate: (body) => {
            const { PMCd, PSCd, PDesc, PValue } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('Metal Code (PMCd) is required');
            }
            if (!PSCd || PSCd.trim() === '') {
                throw new Error('Purity Code (PSCd) is required');
            }
            if (!PDesc || PDesc.trim() === '') {
                throw new Error('Description (PDesc) is required');
            }
            if (!PValue || PValue.trim() === '') {
                throw new Error('Purity Value (PValue) is required');
            }
            return true;
        },

        customAdd: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PSCd, PDesc, PValue } = body;

            const trimmedPMCd = PMCd.trim();
            const trimmedPSCd = PSCd.trim();
            const trimmedPDesc = PDesc.trim();
            const trimmedPValue = PValue.trim();

  
            const checkDuplicateQuery = {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.yDbKc}].[dbo].[yParam]
                    WHERE PTyp = 'yMetKt' 
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
            };

            const duplicateResult = await exeQuery(conn, checkDuplicateQuery);
            if (duplicateResult[0]?.Count > 0) {
                throw new Error(`Metal Purity combination "${trimmedPMCd}" - "${trimmedPSCd}" already exists`);
            }

            const getPValue3Query = {
                rawQuery: `
                    SELECT ISNULL(MAX(CAST(PValue3 AS INT)), 0) + 1 AS NextPValue3
                    FROM [${process.env.yDbKc}].[dbo].[yParam]
                    WHERE PTyp = 'yMetKt'
                `,
                inputTypeMap: {},
                inputValuesMap: {}
            };

            const maxResult = await exeQuery(conn, getPValue3Query);
            const nextPValue3 = maxResult[0]?.NextPValue3 || 1;

   
            const insertQuery = {
                rawQuery: `
                    INSERT INTO [${process.env.yDbKc}].[dbo].[yParam]
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
                    PTyp: 'yMetKt',
                    PMCd: trimmedPMCd,
                    PSCd: trimmedPSCd,
                    PDesc: trimmedPDesc,
                    PDesc225: ' ',
                    PValue: trimmedPValue,
                    PNum: 0,
                    PValue1: ' ',
                    PNum1: 0,
                    PValue2: ' ',
                    ModUsr: modUsr.substring(0, 5),
                    ModTime: 0.00,
                    PValue3: nextPValue3.toString(),
                    PValidYn: ' ',
                    PPrtKey: 'C'
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, insertQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Failed to add Metal Purity');
            }

            return {
                message: 'Metal Purity added successfully',
                PMCd: trimmedPMCd,
                PSCd: trimmedPSCd,
                PDesc: trimmedPDesc,
                PValue: trimmedPValue,
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
                    DELETE FROM [${process.env.yDbKc}].[dbo].[yParam]
                    WHERE PTyp = 'yMetKt' 
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
                throw new Error('Metal Purity not found');
            }

            return {
                message: 'Metal Purity deleted successfully'
            };
        }
    }
};