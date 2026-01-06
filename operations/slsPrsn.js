const sql = require('mssql');

module.exports = {
    label: 'Manage Sales Person',


    // PMCd dropdown list - from SP/USR join
    getPMCdList: {
        selectClause: `
            usr.PDesc
        `,
        from:  `[${process.env.DB_DATABASE}].[dbo].[Param] sp
               JOIN [${process.env.DB_DATABASE}].[dbo].[Param] usr
                 ON sp.PDesc = usr.PDesc`,
        whereConditions: ["sp.PTyp = @SPTyp", "usr.PTyp = @USRTyp"],
        orderByClause: "usr.PDesc",
        inputTypeMap: {
            SPTyp: sql.VarChar(50),
            USRTyp: sql.VarChar(50)
        },
        inputValuesMap: {
            SPTyp: 'SP',
            USRTyp: 'USR'
        },

    },

    getPSCdList: {
        selectClause: `
            PMCd
        `,
        from: `[${process.env.DB_DATABASE}].[dbo].[Param]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "PMCd",
        inputTypeMap: {
            PTyp: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'USR'
        },

    },

    getData: {
        selectClause: `
            PTyp,
            PMCd,
            PSCd,
            PDesc225
        `,
        from: `[${process.env.yDb}].[dbo].[yParam]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "PMCd",
        inputTypeMap: {
            PTyp: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'yslsPrsn'
        },

    },

    updateData: {
        validate: (body) => {
            const { PMCd, PSCd, PDesc225 } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('Sales Person Code (PMCd) is required');
            }
            if (!PSCd || PSCd.trim() === '') {
                throw new Error('Short Code (PSCd) is required');
            }
            if (!PDesc225 || PDesc225.trim() === '') {
                throw new Error('Description (PDesc225) is required');
            }
            return true;
        },

        customUpdate: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PSCd, PDesc225, OldPMCd, OldPSCd } = body;

            const newPMCd = PMCd.trim();
            const newPSCd = PSCd.trim();
            const newPDesc225 = PDesc225.trim();
            const oldPMCd = (OldPMCd || '').trim();
            const oldPSCd = (OldPSCd || '').trim();

            const isChanged = newPMCd !== oldPMCd || newPSCd !== oldPSCd;

            if (isChanged) {
                const checkDuplicateQuery = {
                    rawQuery: `
                        SELECT COUNT(*) as Count
                        FROM [${process.env.yDb}].[dbo].[yParam]
                        WHERE PTyp = 'yslsPrsn' 
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
                    throw new Error(`Sales Person combination "${newPMCd}" - "${newPSCd}" already exists`);
                }
            }

            const updateQuery = {
                rawQuery: `
                    UPDATE [${process.env.yDb}].[dbo].[yParam]
                    SET 
                        PMCd = @NewPMCd,
                        PSCd = @NewPSCd,
                        PDesc225 = @NewPDesc225,
                        ModUsr = @ModUsr,
                        ModDt = GETDATE(),
                        ModTime = @ModTime
                    WHERE PTyp = 'yslsPrsn'
                      AND PMCd = @OldPMCd
                      AND PSCd = @OldPSCd
                `,
                inputTypeMap: {
                    NewPMCd: sql.VarChar(30),
                    NewPSCd: sql.VarChar(30),
                    NewPDesc225: sql.VarChar(225),
                    OldPMCd: sql.VarChar(30),
                    OldPSCd: sql.VarChar(30),
                    ModUsr: sql.VarChar(5),
                    ModTime: sql.Numeric(5, 2)
                },
                inputValuesMap: {
                    NewPMCd: newPMCd,
                    NewPSCd: newPSCd,
                    NewPDesc225: newPDesc225,
                    OldPMCd: oldPMCd,
                    OldPSCd: oldPSCd,
                    ModUsr: modUsr.substring(0, 5),
                    ModTime: 0.00
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, updateQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Sales person not found or no changes made');
            }

            return {
                message: 'Sales person updated successfully',
                PMCd: newPMCd,
                PSCd: newPSCd,
                PDesc225: newPDesc225
            };
        }
    },

    addData: {
        validate: (body) => {
            const { PMCd, PSCd, PDesc225 } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('Sales Person Code (PMCd) is required');
            }
            if (!PSCd || PSCd.trim() === '') {
                throw new Error('Short Code (PSCd) is required');
            }
            if (!PDesc225 || PDesc225.trim() === '') {
                throw new Error('Description (PDesc225) is required');
            }
            return true;
        },

        customAdd: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PSCd, PDesc225 } = body;

            const trimmedPMCd = PMCd.trim();
            const trimmedPSCd = PSCd.trim();
            const trimmedPDesc225 = PDesc225.trim();

            // Since values come from dropdown, no need to check existence in master tables

            const checkDuplicateQuery = {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.yDb}].[dbo].[yParam]
                    WHERE PTyp = 'yslsPrsn' 
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
                throw new Error(`Sales Person combination "${trimmedPMCd}" - "${trimmedPSCd}" already exists`);
            }

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
                    PTyp: 'yslsPrsn',
                    PMCd: trimmedPMCd,
                    PSCd: trimmedPSCd,
                    PDesc: ' ',
                    PDesc225: trimmedPDesc225,
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
                throw new Error('Failed to add sales person');
            }

            return {
                message: 'Sales person added successfully',
                PMCd: trimmedPMCd,
                PSCd: trimmedPSCd,
                PDesc225: trimmedPDesc225
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

            // Check if sales person is being used in yCustMp
            const checkUsageQuery = {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.yDb}].[dbo].[yParam]
                    WHERE PTyp = 'yCustMp' 
                      AND PMCd = @PMCd
                `,
                inputTypeMap: {
                    PMCd: sql.VarChar(30)
                },
                inputValuesMap: {
                    PMCd: PMCd.trim()
                }
            };

            const usageResult = await exeQuery(conn, checkUsageQuery);
            if (usageResult[0]?.Count > 0) {
                throw new Error(`Cannot delete. Sales Person "${PMCd}" is being used in Customer Mapping`);
            }

            const deleteQuery = {
                rawQuery: `
                    DELETE FROM [${process.env.yDb}].[dbo].[yParam]
                    WHERE PTyp = 'yslsPrsn' 
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
                throw new Error('Sales person not found');
            }

            return {
                message: 'Sales person deleted successfully'
            };
        }
    }
};