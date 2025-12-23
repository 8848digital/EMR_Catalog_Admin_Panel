const sql = require('mssql');

module.exports = {
    label: 'Manage Roles',

    getPMCdList: {
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

    getPSCdList: {
        selectClause: `DISTINCT vPMCd`,
        from:  `[${process.env.DB_DATABASE}].[dbo].[vParam]`,
        whereConditions: [
            "vPTyp = @vPTyp",
            `vPCoCd IN (
                SELECT PSCd
                FROM [8848EmrKC_Testing].[dbo].[yParam]
                WHERE PTyp = 'YvchheAD'
                  AND PMCd = 'CoCd'
                UNION
                SELECT PMCd
                FROM [8848EmrKC_Testing].[dbo].[yParam]
                WHERE PTyp = 'Ystkcocd'
            )`
        ],
        orderByClause: "vPMCd",
        inputTypeMap: {
            vPTyp: sql.VarChar(50)
        },
        inputValuesMap: {
            vPTyp: 'chr'
        },

    },

    getData: {
        selectClause: `
            PTyp,
            PMCd,
            PSCd,
            PNum
        `,
        from:  `[${process.env.yDb}].[dbo].[yParam]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "PMCd, PSCd",
        inputTypeMap: {
            PTyp: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'yRole'
        },

    },

    updateData: {
        validate: (body) => {
            const { PMCd, PSCd, PNum } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('User Code (PMCd) is required');
            }
            if (!PSCd || PSCd.trim() === '') {
                throw new Error('Role Code (PSCd) is required');
            }
            if (PNum === undefined || PNum === null || PNum === '') {
                throw new Error('Active Status (PNum) is required');
            }
            return true;
        },

        customUpdate: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PSCd, PNum, OldPMCd, OldPSCd } = body;

            const newPMCd = PMCd.trim();
            const newPSCd = PSCd.trim();
            const newPNum = parseFloat(PNum); 
            const oldPMCd = (OldPMCd || '').trim();
            const oldPSCd = (OldPSCd || '').trim();

            const isPMCdChanged = newPMCd !== oldPMCd;

      
            if (isPMCdChanged) {
                const checkMasterQuery = {
                    rawQuery: `
                        SELECT COUNT(*) as Count
                        FROM [${process.env.DB_DATABASE}].[dbo].[Param]
                        WHERE PTyp = 'USR' AND PMCd = @PMCd
                    `,
                    inputTypeMap: {
                        PMCd: sql.VarChar(30)
                    },
                    inputValuesMap: {
                        PMCd: newPMCd
                    }
                };

                const masterResult = await exeQuery(conn, checkMasterQuery);
                if (masterResult[0]?.Count === 0) {
                    throw new Error(`User Code "${newPMCd}" does not exist in master Param table`);
                }
            }

            const isChanged = newPMCd !== oldPMCd || newPSCd !== oldPSCd;

            if (isChanged) {
          
                const checkDuplicateQuery = {
                    rawQuery: `
                        SELECT COUNT(*) as Count
                        FROM [${process.env.yDb}].[dbo].[yParam]
                        WHERE PTyp = 'yRole' 
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
                    throw new Error(`Role combination "${newPMCd}" - "${newPSCd}" already exists`);
                }
            }

            const updateQuery = {
                rawQuery: `
                    UPDATE [${process.env.yDb}].[dbo].[yParam]
                    SET 
                        PMCd = @NewPMCd,
                        PSCd = @NewPSCd,
                        PNum = @NewPNum,
                        ModUsr = @ModUsr,
                        ModDt = GETDATE(),
                        ModTime = @ModTime
                    WHERE PTyp = 'yRole'
                      AND PMCd = @OldPMCd 
                      AND PSCd = @OldPSCd
                `,
                inputTypeMap: {
                    NewPMCd: sql.VarChar(30),
                    NewPSCd: sql.VarChar(30),
                    NewPNum: sql.Float,
                    OldPMCd: sql.VarChar(30),
                    OldPSCd: sql.VarChar(30),
                    ModUsr: sql.VarChar(5),
                    ModTime: sql.Numeric(5, 2)
                },
                inputValuesMap: {
                    NewPMCd: newPMCd,
                    NewPSCd: newPSCd,
                    NewPNum: newPNum,
                    OldPMCd: oldPMCd,
                    OldPSCd: oldPSCd,
                    ModUsr: modUsr.substring(0, 5),
                    ModTime: 0.00
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, updateQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Role not found or no changes made');
            }

            return {
                message: 'Role updated successfully',
                PMCd: newPMCd,
                PSCd: newPSCd,
                PNum: newPNum
            };
        }
    },

    addData: {
        validate: (body) => {
            const { PMCd, PSCd, PNum } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('User Code (PMCd) is required');
            }
            if (!PSCd || PSCd.trim() === '') {
                throw new Error('Role Code (PSCd) is required');
            }
            if (PNum === undefined || PNum === null || PNum === '') {
                throw new Error('Active Status (PNum) is required');
            }
            return true;
        },

        customAdd: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PSCd, PNum } = body;

            const trimmedPMCd = PMCd.trim();
            const trimmedPSCd = PSCd.trim();
            const numericPNum = parseFloat(PNum);

            const checkMasterQuery = {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.DB_DATABASE}].[dbo].[Param]
                    WHERE PTyp = 'USR' AND PMCd = @PMCd
                `,
                inputTypeMap: {
                    PMCd: sql.VarChar(30)
                },
                inputValuesMap: {
                    PMCd: trimmedPMCd
                }
            };

            const masterResult = await exeQuery(conn, checkMasterQuery);
            if (masterResult[0]?.Count === 0) {
                throw new Error(`User Code "${trimmedPMCd}" does not exist in master Param table`);
            }

            // Check if combination already exists
            const checkDuplicateQuery = {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.yDb}].[dbo].[yParam]
                    WHERE PTyp = 'yRole' 
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
                throw new Error(`Role combination "${trimmedPMCd}" - "${trimmedPSCd}" already exists`);
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
                    PTyp: 'yRole',
                    PMCd: trimmedPMCd,
                    PSCd: trimmedPSCd,
                    PDesc: ' ',
                    PDesc225: ' ',
                    PValue: ' ',
                    PNum: numericPNum,
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
                throw new Error('Failed to add role');
            }

            return {
                message: 'Role added successfully',
                PMCd: trimmedPMCd,
                PSCd: trimmedPSCd,
                PNum: numericPNum
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
                    WHERE PTyp = 'yRole' 
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
                throw new Error('Role not found');
            }

            return {
                message: 'Role deleted successfully'
            };
        }
    }
};