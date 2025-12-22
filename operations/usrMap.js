const sql = require('mssql');

module.exports = {
    label: 'Manage User Mapping',
    useDatabase: 'yDbKc', 

    getPMCdList: {
        selectClause: `
            PMCd
        `,
        from: (masterDb) => `[${masterDb}].[dbo].[Param]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "PMCd",
        inputTypeMap: {
            PTyp: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'USR'
        },
        useDatabase: 'DB_DATABASEKc'  
    },

    getPSCdList: {
        selectClause: `
            CmCd
        `,
        from: (dbName) => `[${dbName}].[dbo].[CustMst]`,
        whereConditions: [],
        orderByClause: "CmCd",
        inputTypeMap: {},
        inputValuesMap: {},
        useDatabase: 'DB_DATABASEKc' 
    },

    getData: {
        selectClause: `
            PTyp,
            PMCd,
            PSCd
        `,
        from: (dbName) => `[${dbName}].[dbo].[yParam]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "PMCd, PSCd",
        inputTypeMap: {
            PTyp: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'yUsrMap'
        }
    },

    updateData: {
        validate: (body) => {
            const { PMCd, PSCd, OldPMCd, OldPSCd } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('User Code (PMCd) is required');
            }
            if (!PSCd || PSCd.trim() === '') {
                throw new Error('Customer Code (PSCd) is required');
            }
            if (!OldPMCd || !OldPSCd) {
                throw new Error('Original values (OldPMCd and OldPSCd) are required');
            }
            return true;
        },

        customUpdate: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PSCd, OldPMCd, OldPSCd } = body;

            if (!PMCd || !PSCd || !OldPMCd || !OldPSCd) {
                throw new Error('All fields (PMCd, PSCd, OldPMCd, OldPSCd) are required for update');
            }

            const newPMCd = PMCd.trim();
            const newPSCd = PSCd.trim();
            const oldPMCd = OldPMCd.trim();
            const oldPSCd = OldPSCd.trim();

            const isPSCdChanged = newPSCd !== oldPSCd;

            if (isPSCdChanged) {
                // Check if the new PSCd is already mapped to a DIFFERENT user
                // (Same customer code cannot be mapped to different user codes)
                const checkDuplicateQuery = {
                    rawQuery: `
                        SELECT PMCd
                        FROM [${process.env.yDbKc}].[dbo].[yParam]
                        WHERE PTyp = 'yUsrMap' 
                          AND PSCd = @NewPSCd
                          AND PMCd != @NewPMCd
                    `,
                    inputTypeMap: {
                        NewPSCd: sql.VarChar(30),
                        NewPMCd: sql.VarChar(30)
                    },
                    inputValuesMap: {
                        NewPSCd: newPSCd,
                        NewPMCd: newPMCd
                    }
                };

                const duplicateResult = await exeQuery(conn, checkDuplicateQuery);
                if (duplicateResult && duplicateResult.length > 0) {
                    const existingUser = duplicateResult[0].PMCd;
                    throw new Error(`Customer Code "${newPSCd}" is already mapped to User "${existingUser}"`);
                }
            }

            const updateQuery = {
                rawQuery: `
                    UPDATE [${process.env.yDbKc}].[dbo].[yParam]
                    SET 
                        PMCd = @NewPMCd,
                        PSCd = @NewPSCd,
                        ModUsr = @ModUsr,
                        ModDt = GETDATE(),
                        ModTime = @ModTime
                    WHERE PTyp = 'yUsrMap'
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
                throw new Error('User mapping not found or no changes made');
            }

            return {
                message: 'User mapping updated successfully',
                PMCd: newPMCd,
                PSCd: newPSCd
            };
        }
    },

    addData: {
        validate: (body) => {
            const { PMCd, PSCd } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('User Code (PMCd) is required');
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

            const checkDuplicateQuery = {
                rawQuery: `
                    SELECT PMCd
                    FROM [${process.env.yDbKc}].[dbo].[yParam]
                    WHERE PTyp = 'yUsrMap' 
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
            if (duplicateResult && duplicateResult.length > 0) {
                const existingUser = duplicateResult[0].PMCd;
                throw new Error(`Customer Code "${trimmedPSCd}" is already mapped to User "${existingUser}"`);
            }

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
                    PTyp: 'yUsrMap',
                    PMCd: trimmedPMCd,
                    PSCd: trimmedPSCd,
                    PDesc: ' ',
                    PDesc225: ' ',
                    PValue: ' ',
                    PNum: 0,
                    PValue1: ' ',
                    PNum1: 0,
                    PValue2: ' ',
                    ModUsr: modUsr.substring(0, 5),
                    ModTime: 0.00,
                    PValue3: ' ',
                    PValidYn: ' ',
                    PPrtKey: 'C'
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, insertQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Failed to add user mapping');
            }

            return {
                message: 'User mapping added successfully',
                PMCd: trimmedPMCd,
                PSCd: trimmedPSCd
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
                    WHERE PTyp = 'yUsrMap' 
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
                throw new Error('User mapping not found');
            }

            return {
                message: 'User mapping deleted successfully'
            };
        }
    }
};