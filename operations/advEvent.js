const sql = require('mssql');

module.exports = {
    label: 'Manage Advertisement Events',

    getData: {
        selectClause: `
            yPIdNo,
            PTyp,
            PMCd,
            PSCd,
            PDesc,
            PDesc225,
            PValue,
            PValue1,
            PNum,
            PValue2,
            PValue3,
            PValue4,
            PValue5,
            PValue6,
            ModUsr,
            ModDt,
            ModTime
        `,
        from: () => `[${process.env.yDb}].[dbo].[YAdCfg]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "ModDt DESC",
        inputTypeMap: {
            PTyp: sql.VarChar(140)
        },
        inputValuesMap: {
            PTyp: 'YAdvEvent'
        }
    },

    updateData: {
        validate: (body) => {
            const { yPIdNo, PMCd, PDesc225, PValue, PValue1, PNum } = body;

            if (!yPIdNo) {
                throw new Error('Record ID (yPIdNo) is required');
            }
            if (!PMCd || PMCd.trim() === '') {
                throw new Error('Title (PMCd) is required');
            }
            if (!PDesc225 || PDesc225.trim() === '') {
                throw new Error('Description (PDesc225) is required');
            }
            if (!PValue || PValue.trim() === '') {
                throw new Error('Start Date (PValue) is required');
            }
            if (!PValue1 || PValue1.trim() === '') {
                throw new Error('End Date (PValue1) is required');
            }
            if (!PNum || PNum <= 0) {
                throw new Error('Duration (PNum) must be greater than 0');
            }

            const startDate = new Date(PValue);
            const endDate = new Date(PValue1);
            if (startDate >= endDate) {
                throw new Error('End Date must be after Start Date');
            }

            // Validate at least one image
            if (!body.PValue2 || body.PValue2.trim() === '') {
                throw new Error('At least one image (IMG1) is required');
            }

            return true;
        },

        customUpdate: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const {
                yPIdNo, PMCd, PSCd, PDesc, PDesc225,
                PValue, PValue1, PNum,
                PValue2, PValue3, PValue4, PValue5, PValue6
            } = body;

            const updateQuery = {
                rawQuery: `
                    UPDATE [${process.env.yDb}].[dbo].[YAdCfg]
                    SET 
                        PMCd = @PMCd,
                        PSCd = @PSCd,
                        PDesc = @PDesc,
                        PDesc225 = @PDesc225,
                        PValue = @PValue,
                        PValue1 = @PValue1,
                        PNum = @PNum,
                        PValue2 = @PValue2,
                        PValue3 = @PValue3,
                        PValue4 = @PValue4,
                        PValue5 = @PValue5,
                        PValue6 = @PValue6,
                        ModUsr = @ModUsr,
                        ModDt = GETDATE(),
                        ModTime = @ModTime
                    WHERE yPIdNo = @yPIdNo
                      AND PTyp = 'YAdvEvent'
                `,
                inputTypeMap: {
                    yPIdNo: sql.Int,
                    PMCd: sql.VarChar(140),
                    PSCd: sql.VarChar(140),
                    PDesc: sql.VarChar(140),
                    PDesc225: sql.VarChar(225),
                    PValue: sql.VarChar(140),
                    PValue1: sql.VarChar(140),
                    PNum: sql.Float,
                    PValue2: sql.VarChar(sql.MAX),
                    PValue3: sql.VarChar(sql.MAX),
                    PValue4: sql.VarChar(sql.MAX),
                    PValue5: sql.VarChar(sql.MAX),
                    PValue6: sql.VarChar(sql.MAX),
                    ModUsr: sql.VarChar(5),
                    ModTime: sql.Numeric(5, 2)
                },
                inputValuesMap: {
                    yPIdNo: parseInt(yPIdNo),
                    PMCd: (PMCd || '').trim(),
                    PSCd: (PSCd || '').trim(),
                    PDesc: (PDesc || '').trim(),
                    PDesc225: (PDesc225 || '').trim(),
                    PValue: (PValue || '').trim(),
                    PValue1: (PValue1 || '').trim(),
                    PNum: parseFloat(PNum),
                    PValue2: (PValue2 || '').trim(),
                    PValue3: (PValue3 || '').trim(),
                    PValue4: (PValue4 || '').trim(),
                    PValue5: (PValue5 || '').trim(),
                    PValue6: (PValue6 || '').trim(),
                    ModUsr: modUsr.substring(0, 5),
                    ModTime: 0.00
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, updateQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Advertisement Event not found or no changes made');
            }

            return {
                message: 'Advertisement Event updated successfully',
                yPIdNo: yPIdNo
            };
        }
    },

    addData: {
        validate: (body) => {
            const { PMCd, PDesc225, PValue, PValue1, PNum, PValue2 } = body;

            if (!PMCd || PMCd.trim() === '') {
                throw new Error('Title (PMCd) is required');
            }
            if (!PDesc225 || PDesc225.trim() === '') {
                throw new Error('Description (PDesc225) is required');
            }
            if (!PValue || PValue.trim() === '') {
                throw new Error('Start Date (PValue) is required');
            }
            if (!PValue1 || PValue1.trim() === '') {
                throw new Error('End Date (PValue1) is required');
            }
            const startDate = new Date(PValue);
            const endDate = new Date(PValue1);
            if (startDate >= endDate) {
                throw new Error('End Date must be after Start Date');
            }
            if (!PNum || PNum <= 0) {
                throw new Error('Duration (PNum) must be greater than 0');
            }
            if (!PValue2 || PValue2.trim() === '') {
                throw new Error('At least one image (IMG1) is required');
            }

            return true;
        },

        customAdd: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const {
                PMCd, PSCd, PDesc, PDesc225,
                PValue, PValue1, PNum,
                PValue2, PValue3, PValue4, PValue5, PValue6
            } = body;

            const insertQuery = {
                rawQuery: `
                    INSERT INTO [${process.env.yDb}].[dbo].[YAdCfg]
                    (PTyp, PMCd, PSCd, PDesc, PDesc225, PValue, PValue1, PNum, 
                     PValue2, PValue3, PValue4, PValue5, PValue6, ModUsr, ModDt, ModTime)
                    VALUES 
                    (@PTyp, @PMCd, @PSCd, @PDesc, @PDesc225, @PValue, @PValue1, @PNum,
                     @PValue2, @PValue3, @PValue4, @PValue5, @PValue6, @ModUsr, GETDATE(), @ModTime);
                    
                    SELECT SCOPE_IDENTITY() AS yPIdNo;
                `,
                inputTypeMap: {
                    PTyp: sql.VarChar(140),
                    PMCd: sql.VarChar(140),
                    PSCd: sql.VarChar(140),
                    PDesc: sql.VarChar(140),
                    PDesc225: sql.VarChar(225),
                    PValue: sql.VarChar(140),
                    PValue1: sql.VarChar(140),
                    PNum: sql.Float,
                    PValue2: sql.VarChar(sql.MAX),
                    PValue3: sql.VarChar(sql.MAX),
                    PValue4: sql.VarChar(sql.MAX),
                    PValue5: sql.VarChar(sql.MAX),
                    PValue6: sql.VarChar(sql.MAX),
                    ModUsr: sql.VarChar(5),
                    ModTime: sql.Numeric(5, 2)
                },
                inputValuesMap: {
                    PTyp: 'YAdvEvent',
                    PMCd: (PMCd || '').trim(),
                    PSCd: (PSCd || '').trim(),
                    PDesc: (PDesc || '').trim(),
                    PDesc225: (PDesc225 || '').trim(),
                    PValue: (PValue || '').trim(),
                    PValue1: (PValue1 || '').trim(),
                    PNum: parseFloat(PNum),
                    PValue2: (PValue2 || '').trim(),
                    PValue3: (PValue3 || '').trim(),
                    PValue4: (PValue4 || '').trim(),
                    PValue5: (PValue5 || '').trim(),
                    PValue6: (PValue6 || '').trim(),
                    ModUsr: modUsr.substring(0, 5),
                    ModTime: 0.00
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, insertQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Failed to add Advertisement Event');
            }

            const newId = result.recordset && result.recordset[0]
                ? result.recordset[0].yPIdNo
                : null;

            return {
                message: 'Advertisement Event added successfully',
                yPIdNo: newId
            };
        }
    },

    deleteData: {
        customDelete: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { yPIdNo } = body;

            if (!yPIdNo) {
                throw new Error('yPIdNo is required for deletion');
            }

            // First, get the record to find image paths
            const getQuery = {
                rawQuery: `
        SELECT PValue2, PValue3, PValue4, PValue5, PValue6
        FROM [${process.env.yDb}].[dbo].[YAdCfg]
        WHERE yPIdNo = @yPIdNo AND PTyp = 'YAdvEvent'
      `,
                inputTypeMap: {
                    yPIdNo: sql.Int
                },
                inputValuesMap: {
                    yPIdNo: parseInt(yPIdNo)
                },
                returnRaw: true
            };

            const imageData = await exeQuery(conn, getQuery);

            // Delete the record
            const deleteQuery = {
                rawQuery: `
        DELETE FROM [${process.env.yDb}].[dbo].[YAdCfg]
        WHERE yPIdNo = @yPIdNo AND PTyp = 'YAdvEvent'
      `,
                inputTypeMap: {
                    yPIdNo: sql.Int
                },
                inputValuesMap: {
                    yPIdNo: parseInt(yPIdNo)
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, deleteQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Advertisement Event not found');
            }

            return {
                message: 'Advertisement Event deleted successfully',
                imagePaths: imageData.recordset && imageData.recordset[0] ? [
                    imageData.recordset[0].PValue2,
                    imageData.recordset[0].PValue3,
                    imageData.recordset[0].PValue4,
                    imageData.recordset[0].PValue5,
                    imageData.recordset[0].PValue6
                ].filter(path => path && path.trim() !== '') : []
            };
        }
    }
};