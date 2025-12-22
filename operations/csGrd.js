const sql = require('mssql');

module.exports = {
    label: 'Manage Colour Stone Grade',
    useDatabase: 'yDbKc', 

    getPMCdList: {
        selectClause: `
            PSCd
        `,
        from: (masterDb) => `[${masterDb}].[dbo].[Param]`,
        whereConditions: ["PTyp = @PTyp", "PMCd = @PMCd"],
        orderByClause: "PSCd",
        inputTypeMap: {
            PTyp: sql.VarChar(50),
            PMCd: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'GRDCD',
            PMCd: 'CS'
        },
        useDatabase: 'DB_DATABASEKc'  
    },

    getData: {
        selectClause: `
            PTyp,
            PMCd,
            PDesc
        `,
        from: (dbName) => `[${dbName}].[dbo].[yParam]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "PMCd",
        inputTypeMap: {
            PTyp: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'yCsGrd'
        }
    },

    updateData: {
        validate: (body) => {
            const { PMCd, PDesc, OldPMCd } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('CS Grade Code (PMCd) is required');
            }
            if (!PDesc || PDesc.trim() === '') {
                throw new Error('Description (PDesc) is required');
            }
            if (!OldPMCd) {
                throw new Error('Original PMCd (OldPMCd) is required');
            }
            return true;
        },

        customUpdate: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PDesc, OldPMCd } = body;

            const newPMCd = PMCd.trim();
            const newPDesc = PDesc.trim();
            const oldPMCd = OldPMCd.trim();

            const isPMCdChanged = newPMCd !== oldPMCd;

            if (isPMCdChanged) {
                const checkDuplicateQuery = {
                    rawQuery: `
                        SELECT COUNT(*) as Count
                        FROM [${process.env.yDbKc}].[dbo].[yParam]
                        WHERE PTyp = 'yCsGrd' 
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
                    throw new Error(`CS Grade Code "${newPMCd}" already exists`);
                }
            }

            const updateQuery = {
                rawQuery: `
                    UPDATE [${process.env.yDbKc}].[dbo].[yParam]
                    SET 
                        PMCd = @NewPMCd,
                        PDesc = @NewPDesc,
                        ModUsr = @ModUsr,
                        ModDt = GETDATE(),
                        ModTime = @ModTime
                    WHERE PTyp = 'yCsGrd'
                      AND PMCd = @OldPMCd
                `,
                inputTypeMap: {
                    NewPMCd: sql.VarChar(30),
                    NewPDesc: sql.VarChar(30),
                    OldPMCd: sql.VarChar(30),
                    ModUsr: sql.VarChar(5),
                    ModTime: sql.Numeric(5, 2)
                },
                inputValuesMap: {
                    NewPMCd: newPMCd,
                    NewPDesc: newPDesc,
                    OldPMCd: oldPMCd,
                    ModUsr: modUsr.substring(0, 5),
                    ModTime: 0.00
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, updateQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('CS Grade not found or no changes made');
            }

            return {
                message: 'CS Grade updated successfully',
                PMCd: newPMCd,
                PDesc: newPDesc
            };
        }
    },

    addData: {
        validate: (body) => {
            const { PMCd, PDesc } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('CS Grade Code (PMCd) is required');
            }
            if (!PDesc || PDesc.trim() === '') {
                throw new Error('Description (PDesc) is required');
            }
            return true;
        },

        customAdd: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PDesc } = body;

            const trimmedPMCd = PMCd.trim();
            const trimmedPDesc = PDesc.trim();

            // Check if PMCd already exists
            const checkDuplicateQuery = {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.yDbKc}].[dbo].[yParam]
                    WHERE PTyp = 'yCsGrd' 
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
                throw new Error(`CS Grade Code "${trimmedPMCd}" already exists`);
            }

            // Generate PValue3 (max+1) 
            const getPValue3Query = {
                rawQuery: `
                    SELECT ISNULL(MAX(CAST(PValue3 AS INT)), 0) + 1 AS NextPValue3
                    FROM [${process.env.yDbKc}].[dbo].[yParam]
                    WHERE PTyp = 'yCsGrd'
                `,
                inputTypeMap: {},
                inputValuesMap: {}
            };

            const maxResult = await exeQuery(conn, getPValue3Query);
            const nextPValue3 = maxResult[0]?.NextPValue3 || 1;

            // Insert new record 
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
                    PTyp: 'yCsGrd',
                    PMCd: trimmedPMCd,
                    PSCd: ' ',
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
                throw new Error('Failed to add CS Grade');
            }

            return {
                message: 'CS Grade added successfully',
                PMCd: trimmedPMCd,
                PDesc: trimmedPDesc,
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
                    DELETE FROM [${process.env.yDbKc}].[dbo].[yParam]
                    WHERE PTyp = 'yCsGrd' 
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
                throw new Error('CS Grade not found');
            }

            return {
                message: 'CS Grade deleted successfully'
            };
        }
    }
};