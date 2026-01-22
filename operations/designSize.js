const sql = require('mssql');

module.exports = {
    label: 'Manage Design Size',

    // Get list of Design Categories (PMCd) for dropdown filter
    getPMCdList: {
        selectClause: `DISTINCT PMCd`,
        from: `[${process.env.yDb}].[dbo].[yParam]`,
        whereConditions: ["PTyp = @PTyp", "PMCd != ''"],
        orderByClause: "PMCd",
        inputTypeMap: {
            PTyp: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'yDmSz'
        },
    },

    // Get list of Size Codes (PSCd) from master Param table
    getPSCdList: {
        selectClause: `PMCd`,
        from: `[${process.env.DB_DATABASE}].[dbo].[Param]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "PMCd",
        inputTypeMap: {
            PTyp: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'DMSZ'
        },

    },

    getNewCategoryList: {
        selectClause: `PMCd, PDesc`,
        from: `[${process.env.DB_DATABASE}].[dbo].[Param]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "PMCd",
        inputTypeMap: {
            PTyp: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'dmctg'
        },
    },

    // Get existing design sizes for selected PMCd
    getData: {
        selectClause: `
            PMCd,
            PSCd,
            PDesc,
            PValue3
        `,
        from:`[${process.env.yDb}].[dbo].[yParam]`,
        whereConditions: ["PTyp = @PTyp", "PMCd = @PMCd"],
        orderByClause: "CAST(PValue3 AS INT)",
        inputTypeMap: {
            PTyp: sql.VarChar(50),
            PMCd: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'yDmSz'
        },

    },

    updateData: {
        validate: (body) => {
            const { PSCd, PDesc, PMCd, OldPValue3 } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('Design Category (PMCd) is required');
            }
            if (!PSCd || PSCd.trim() === '') {
                throw new Error('Size Code (PSCd) is required');
            }
            if (!PDesc || PDesc.trim() === '') {
                throw new Error('Label (PDesc) is required');
            }
            if (!OldPValue3 || OldPValue3.trim() === '') {
                throw new Error('PValue3 is required for update');
            }
            return true;
        },

        customUpdate: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PSCd, PDesc, OldPValue3 } = body;

            const trimmedPMCd = PMCd.trim();
            const trimmedPSCd = PSCd.trim();
            const trimmedPDesc = PDesc.trim();
            const trimmedOldPValue3 = OldPValue3.trim();

            // Validate size exists in master (Size Code should match master)
            const masterSizeCheck = await exeQuery(conn, {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.DB_DATABASE}].[dbo].[Param]
                    WHERE PMCd = @SizeValue AND PTyp = 'DMSZ'
                `,
                inputTypeMap: {
                    SizeValue: sql.VarChar(20)
                },
                inputValuesMap: {
                    SizeValue: trimmedPSCd
                }
            });

            if (masterSizeCheck[0]?.Count === 0) {
                throw new Error(`Size "${trimmedPSCd}" does not exist in master sizes. Please enter a valid size.`);
            }

            // Check for duplicate PSCd in this PMCd (excluding current record)
            const duplicateCheck = await exeQuery(conn, {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.yDb}].[dbo].[yParam]
                    WHERE PTyp = 'yDmSz' 
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
                throw new Error(`Size "${trimmedPSCd}" already exists in design category "${trimmedPMCd}".`);
            }

            const queryStmts = {
                rawQuery: `
                    UPDATE [${process.env.yDb}].[dbo].[yParam]
                    SET 
                        PSCd = @PSCd,
                        PDesc = @PDesc,
                        ModUsr = @ModUsr,
                        ModDt = GETDATE(),
                        ModTime = @ModTime
                    WHERE PTyp = 'yDmSz' 
                      AND PMCd = @PMCd
                      AND PValue3 = @PValue3
                `,
                inputTypeMap: {
                    PSCd: sql.VarChar(30),
                    PMCd: sql.VarChar(30),
                    PValue3: sql.VarChar(30),
                    PDesc: sql.VarChar(30),
                    ModUsr: sql.VarChar(5),
                    ModTime: sql.Numeric(5, 2)
                },
                inputValuesMap: {
                    PSCd: trimmedPSCd,
                    PMCd: trimmedPMCd,
                    PValue3: trimmedOldPValue3,
                    PDesc: trimmedPDesc,
                    ModUsr: modUsr.substring(0, 5),
                    ModTime: 0.00
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, queryStmts);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Design Size not found or no changes made');
            }

            return {
                message: 'Design Size updated successfully',
                PMCd: trimmedPMCd,
                PSCd: trimmedPSCd,
                PDesc: trimmedPDesc,
                PValue3: trimmedOldPValue3
            };
        }
    },

    addData: {
        validate: (body) => {
            const { PDesc, PMCd, PSCd } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('Design Category (PMCd) is required');
            }
            if (!PSCd || PSCd.trim() === '') {
                throw new Error('Size Code (PSCd) is required');
            }
            if (!PDesc || PDesc.trim() === '') {
                throw new Error('Label (PDesc) is required');
            }
            return true;
        },

        customAdd: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PDesc, PMCd, PSCd } = body;

            const trimmedPMCd = PMCd.trim();
            const trimmedPSCd = PSCd.trim();
            const trimmedPDesc = PDesc.trim();

            // Validate size exists in master
            const masterSizeCheck = await exeQuery(conn, {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.DB_DATABASE}].[dbo].[Param]
                    WHERE PMCd = @SizeValue AND PTyp = 'DMSZ'
                `,
                inputTypeMap: {
                    SizeValue: sql.VarChar(20)
                },
                inputValuesMap: {
                    SizeValue: trimmedPSCd
                }
            });

            if (masterSizeCheck[0]?.Count === 0) {
                throw new Error(`Size "${trimmedPSCd}" does not exist in master sizes. Please enter a valid size.`);
            }

            // Check for duplicate PSCd in this PMCd
            const duplicateCheck = await exeQuery(conn, {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.yDb}].[dbo].[yParam]
                    WHERE PTyp = 'yDmSz' 
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
                throw new Error(`Size "${trimmedPSCd}" already exists in design category "${trimmedPMCd}".`);
            }

            // Get next PValue3 for this PMCd (MAX + 1)
            const getMaxPValue3Query = {
                rawQuery: `
                    SELECT ISNULL(MAX(CAST(PValue3 AS INT)), 0) + 1 AS NextPValue3
                    FROM [${process.env.yDb}].[dbo].[yParam]
                    WHERE PTyp = 'yDmSz' AND PMCd = @PMCd
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
                    PTyp: 'yDmSz',
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
                throw new Error('Failed to add design size');
            }

            return {
                message: 'Design Size added successfully',
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
                    WHERE PTyp = 'yDmSz' 
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
                throw new Error('Design Size record not found');
            }

            return {
                message: 'Design Size deleted successfully'
            };
        }
    }
};