const sql = require('mssql');

module.exports = {
    label: 'Manage Metal Color',
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

    getPSCdList: {
        selectClause: `
            PSCd
        `,
        from: (dbName) => `[${dbName}].[dbo].[Param]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "PSCd",
        inputTypeMap: {
            PTyp: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'rmcol'
        },
        useDatabase: 'DB_DATABASEKc' 
    },

    getData: {
        selectClause: `
            PTyp,
            PMCd,
            PSCd,
            PDesc,
            PValue3
        `,
        from: (dbName) => `[${dbName}].[dbo].[yParam]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "CAST(PValue3 AS INT)",
        inputTypeMap: {
            PTyp: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'yMetCol'
        },
        useDatabase: 'yDbKc' 
    },

    updateData: {
        validate: (body) => {
            const { PMCd, PSCd, PDesc } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('Metal Code (PMCd) is required');
            }
            if (!PSCd || PSCd.trim() === '') {
                throw new Error('Color Code (PSCd) is required');
            }
            if (!PDesc || PDesc.trim() === '') {
                throw new Error('Description (PDesc) is required');
            }
            return true;
        },

        customUpdate: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PSCd, PDesc, OldPMCd, OldPSCd } = body;

            const newPMCd = PMCd.trim();
            const newPSCd = PSCd.trim();
            const newPDesc = PDesc.trim();
            const oldPMCd = (OldPMCd || '').trim();
            const oldPSCd = (OldPSCd || '').trim();

            const isChanged = newPMCd !== oldPMCd || newPSCd !== oldPSCd;

            if (isChanged) {
                const checkDuplicateQuery = {
                    rawQuery: `
                        SELECT COUNT(*) as Count
                        FROM [${process.env.yDbKc}].[dbo].[yParam]
                        WHERE PTyp = 'yMetCol' 
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
                    throw new Error(`Metal Color combination "${newPMCd}" - "${newPSCd}" already exists`);
                }
            }

            const updateQuery = {
                rawQuery: `
                    UPDATE [${process.env.yDbKc}].[dbo].[yParam]
                    SET 
                        PMCd = @NewPMCd,
                        PSCd = @NewPSCd,
                        PDesc = @NewPDesc,
                        ModUsr = @ModUsr,
                        ModDt = GETDATE(),
                        ModTime = @ModTime
                    WHERE PTyp = 'yMetCol'
                      AND PMCd = @OldPMCd 
                      AND PSCd = @OldPSCd
                `,
                inputTypeMap: {
                    NewPMCd: sql.VarChar(30),
                    NewPSCd: sql.VarChar(30),
                    NewPDesc: sql.VarChar(30),
                    OldPMCd: sql.VarChar(30),
                    OldPSCd: sql.VarChar(30),
                    ModUsr: sql.VarChar(5),
                    ModTime: sql.Numeric(5, 2)
                },
                inputValuesMap: {
                    NewPMCd: newPMCd,
                    NewPSCd: newPSCd,
                    NewPDesc: newPDesc,
                    OldPMCd: oldPMCd,
                    OldPSCd: oldPSCd,
                    ModUsr: modUsr.substring(0, 5),
                    ModTime: 0.00
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, updateQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Metal Color not found or no changes made');
            }

            return {
                message: 'Metal Color updated successfully',
                PMCd: newPMCd,
                PSCd: newPSCd,
                PDesc: newPDesc
            };
        }
    },

    addData: {
        validate: (body) => {
            const { PMCd, PSCd, PDesc } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('Metal Code (PMCd) is required');
            }
            if (!PSCd || PSCd.trim() === '') {
                throw new Error('Color Code (PSCd) is required');
            }
            if (!PDesc || PDesc.trim() === '') {
                throw new Error('Description (PDesc) is required');
            }
            return true;
        },

        customAdd: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PSCd, PDesc } = body;

            const trimmedPMCd = PMCd.trim();
            const trimmedPSCd = PSCd.trim();
            const trimmedPDesc = PDesc.trim();

            // Check if combination already exists
            const checkDuplicateQuery = {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.yDbKc}].[dbo].[yParam]
                    WHERE PTyp = 'yMetCol' 
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
                throw new Error(`Metal Color combination "${trimmedPMCd}" - "${trimmedPSCd}" already exists`);
            }

            // Generate PValue3 (max+1) from yDbKc
            const getPValue3Query = {
                rawQuery: `
                    SELECT ISNULL(MAX(CAST(PValue3 AS INT)), 0) + 1 AS NextPValue3
                    FROM [${process.env.yDbKc}].[dbo].[yParam]
                    WHERE PTyp = 'yMetCol'
                `,
                inputTypeMap: {},
                inputValuesMap: {}
            };

            const maxResult = await exeQuery(conn, getPValue3Query);
            const nextPValue3 = maxResult[0]?.NextPValue3 || 1;

            // Insert new record into yDbKc
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
                    PTyp: 'yMetCol',
                    PMCd: trimmedPMCd,
                    PSCd: trimmedPSCd,
                    PDesc: trimmedPDesc,
                    PDesc225: ' ',
                    PValue: ' ',
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
                throw new Error('Failed to add Metal Color');
            }

            return {
                message: 'Metal Color added successfully',
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
            const { PMCd, PSCd } = body;

            if (!PMCd || !PSCd) {
                throw new Error('PMCd and PSCd are required for deletion');
            }

            const deleteQuery = {
                rawQuery: `
                    DELETE FROM [${process.env.yDbKc}].[dbo].[yParam]
                    WHERE PTyp = 'yMetCol' 
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
                throw new Error('Metal Color not found');
            }

            return {
                message: 'Metal Color deleted successfully'
            };
        }
    }
};