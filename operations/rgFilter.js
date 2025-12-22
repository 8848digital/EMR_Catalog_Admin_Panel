const sql = require('mssql');

module.exports = {
    label: 'Manage Range Filter',
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
            PMCdPattern: '%Rg'
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
            PNum,
            PNum1,
            PValue3
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

    // Bulk save for all range records
    bulkSave: {
        customBulkSave: async (conn, records, PMCd, modUsr) => {
            const { sql, exeQuery } = conn;
            
            let updatedCount = 0;
            let insertedCount = 0;
            const errors = [];

            try {
                // Process each record
                for (const record of records) {
                    const { PSCd, PDesc, PNum, PNum1, PValue3, isNew } = record;

                    // Validate required fields
                    if (!PSCd || (typeof PSCd === 'string' && PSCd.trim() === '')) {
                        errors.push(`Record with PValue3=${PValue3}: PSCd is required`);
                        continue;
                    }

                    if (!PDesc || (typeof PDesc === 'string' && PDesc.trim() === '')) {
                        errors.push(`Record PSCd=${PSCd}: PDesc is required`);
                        continue;
                    }

                    // Safely handle string trimming
                    const trimmedPSCd = typeof PSCd === 'string' ? PSCd.trim() : String(PSCd);
                    const trimmedPDesc = typeof PDesc === 'string' ? PDesc.trim() : String(PDesc);
                    
                    // Parse numeric values
                    const numPNum = parseFloat(PNum || 0);
                    const numPNum1 = (PNum1 !== null && PNum1 !== undefined && PNum1 !== '') 
                        ? parseFloat(PNum1) 
                        : null;

                    if (isNew) {
                        // INSERT new record
                        
                        // Check for duplicate PSCd
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
                                PMCd: PMCd,
                                PSCd: trimmedPSCd
                            }
                        });

                        if (duplicateCheck[0]?.Count > 0) {
                            errors.push(`PSCd "${trimmedPSCd}" already exists`);
                            continue;
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
                                PTyp: 'yFilter',
                                PMCd: PMCd,
                                PSCd: trimmedPSCd,
                                PDesc: trimmedPDesc,
                                PDesc225: ' ',
                                PValue: ' ',
                                PNum: numPNum,
                                PValue1: ' ',
                                PNum1: numPNum1,
                                PValue2: ' ',
                                ModUsr: modUsr.substring(0, 5),
                                ModTime: 0.00,
                                PValue3: PValue3,
                                PValidYn: ' ',
                                PPrtKey: 'C'
                            },
                            returnRaw: true
                        };

                        await exeQuery(conn, insertQuery);
                        insertedCount++;

                    } else {
                        // UPDATE existing record
                        const updateQuery = {
                            rawQuery: `
                                UPDATE [${process.env.yDb}].[dbo].[yParam]
                                SET 
                                    PSCd = @PSCd,
                                    PDesc = @PDesc,
                                    PNum = @PNum,
                                    PNum1 = @PNum1,
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
                                PDesc: sql.VarChar(30),
                                PNum: sql.Float,
                                PNum1: sql.Float,
                                PValue3: sql.VarChar(30),
                                ModUsr: sql.VarChar(5),
                                ModTime: sql.Numeric(5, 2)
                            },
                            inputValuesMap: {
                                PSCd: trimmedPSCd,
                                PMCd: PMCd,
                                PDesc: trimmedPDesc,
                                PNum: numPNum,
                                PNum1: numPNum1,
                                PValue3: PValue3,
                                ModUsr: modUsr.substring(0, 5),
                                ModTime: 0.00
                            },
                            returnRaw: true
                        };

                        const result = await exeQuery(conn, updateQuery);
                        if (result.rowsAffected[0] > 0) {
                            updatedCount++;
                        }
                    }
                }

                return {
                    message: `Bulk save completed: ${insertedCount} inserted, ${updatedCount} updated${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
                    data: {
                        inserted: insertedCount,
                        updated: updatedCount,
                        errors: errors
                    }
                };

            } catch (error) {
                console.error('Error in bulk save:', error);
                throw new Error(`Bulk save failed: ${error.message}`);
            }
        }
    },

    deleteData: {
        customDelete: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { PMCd, PValue3 } = body;

            if (!PMCd || !PValue3) {
                throw new Error('PMCd and PValue3 are required for deletion');
            }

            const trimmedPMCd = typeof PMCd === 'string' ? PMCd.trim() : String(PMCd);
            const trimmedPValue3 = typeof PValue3 === 'string' ? PValue3.trim() : String(PValue3);

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
                    PMCd: trimmedPMCd,
                    PValue3: trimmedPValue3
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, queryStmts);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Range Filter record not found');
            }

            return {
                message: 'Range Filter deleted successfully'
            };
        }
    }
};