require('dotenv').config();
const sql = require('mssql');
const { exeQuery } = require('../utils/queryHandler');

module.exports = {
    label: 'Manage Sales Person',

    getData: {
        selectClause: `
            RTRIM(LTRIM(PMCd)) AS SPId,
            REPLACE(REPLACE(RTRIM(LTRIM(PDesc)), CHAR(13), ''), CHAR(10), '') AS [Name],
            RTRIM(LTRIM(PValue)) AS CoCd
        `,
        from: `[${process.env.yDb}].[dbo].[yparam]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "PValue, PMCd",
        inputTypeMap: {
            PTyp: sql.VarChar(20)
        },
        inputValuesMap: {
            PTyp: 'SP'
        }
    },

    addData: {
        validate: (body) => {
            if (!body.SPId || !body.SPId.trim()) throw new Error('Sales Person ID (SPId) is required');
            if (!body.Name || !body.Name.trim()) throw new Error('Sales Person Name is required');
            if (!body.CoCd || !body.CoCd.trim()) throw new Error('Company Code (CoCd) is required');
            return true;
        },

        customAdd: async (conn, body, modUsr) => {
            const execute = conn.exeQuery || exeQuery;
            const spId = body.SPId.trim();
            const name = body.Name.trim();
            const coCd = body.CoCd.trim();
            const user = (body.modUsr || modUsr || 'ADM').substring(0, 5);

            // Check if Sales Person ID already exists
            const checkQuery = {
                rawQuery: `
                    SELECT COUNT(*) AS [Count]
                    FROM [${process.env.yDb}].[dbo].[yparam]
                    WHERE PTyp = 'SP' AND PMCd = @SPId
                `,
                inputTypeMap: {
                    SPId: sql.VarChar(30)
                },
                inputValuesMap: {
                    SPId: spId
                }
            };

            const existing = await execute(conn, checkQuery);
            if (existing && existing[0] && existing[0].Count > 0) {
                throw new Error(`Sales Person ID "${spId}" already exists. Sales Person ID must be unique.`);
            }

            const now = new Date();
            const modTime = parseFloat(`${now.getHours()}.${now.getMinutes().toString().padStart(2, '0')}`) || 0;

            const insertQuery = {
                rawQuery: `
                    INSERT INTO [${process.env.yDb}].[dbo].[yparam]
                    (PTyp, PMCd, PSCd, PDesc, PDesc225, PValue, PNum, PValue1, PNum1, PValue2, ModUsr, ModDt, ModTime, PValue3, PValidYn, PPrtKey)
                    VALUES 
                    ('SP', @SPId, '', @Name, '', @CoCd, 0, '', 0, '', @ModUsr, GETDATE(), @ModTime, '', '', 'C')
                `,
                inputTypeMap: {
                    SPId: sql.VarChar(30),
                    Name: sql.VarChar(30),
                    CoCd: sql.VarChar(30),
                    ModUsr: sql.VarChar(5),
                    ModTime: sql.Numeric(5, 2)
                },
                inputValuesMap: {
                    SPId: spId,
                    Name: name,
                    CoCd: coCd,
                    ModUsr: user,
                    ModTime: modTime
                },
                returnRaw: true
            };

            await execute(conn, insertQuery);
            return { message: 'Sales Person added successfully' };
        }
    },

    updateData: {
        validate: (body) => {
            if (!body.SPId || !body.SPId.trim()) throw new Error('Sales Person ID (SPId) is required');
            if (!body.Name || !body.Name.trim()) throw new Error('Sales Person Name is required');
            if (!body.CoCd || !body.CoCd.trim()) throw new Error('Company Code (CoCd) is required');
            if (!body.OldSPId || !body.OldSPId.trim()) throw new Error('Original SPId is required');
            return true;
        },

        customUpdate: async (conn, body, modUsr) => {
            const execute = conn.exeQuery || exeQuery;
            const spId = body.SPId.trim();
            const name = body.Name.trim();
            const coCd = body.CoCd.trim();
            const oldSpId = body.OldSPId.trim();
            const user = (body.modUsr || modUsr || 'ADM').substring(0, 5);

            // If SPId changed, verify the new SPId is not taken
            if (spId.toLowerCase() !== oldSpId.toLowerCase()) {
                const checkQuery = {
                    rawQuery: `
                        SELECT COUNT(*) AS [Count]
                        FROM [${process.env.yDb}].[dbo].[yparam]
                        WHERE PTyp = 'SP' AND PMCd = @SPId AND PMCd <> @OldSPId
                    `,
                    inputTypeMap: {
                        SPId: sql.VarChar(30),
                        OldSPId: sql.VarChar(30)
                    },
                    inputValuesMap: {
                        SPId: spId,
                        OldSPId: oldSpId
                    }
                };

                const existing = await execute(conn, checkQuery);
                if (existing && existing[0] && existing[0].Count > 0) {
                    throw new Error(`Sales Person ID "${spId}" already exists. Sales Person ID must be unique.`);
                }
            }

            const now = new Date();
            const modTime = parseFloat(`${now.getHours()}.${now.getMinutes().toString().padStart(2, '0')}`) || 0;

            const updateQuery = {
                rawQuery: `
                    UPDATE [${process.env.yDb}].[dbo].[yparam]
                    SET 
                        PMCd = @SPId,
                        PDesc = @Name,
                        PValue = @CoCd,
                        ModUsr = @ModUsr,
                        ModDt = GETDATE(),
                        ModTime = @ModTime
                    WHERE PTyp = 'SP' AND PMCd = @OldSPId
                `,
                inputTypeMap: {
                    SPId: sql.VarChar(30),
                    Name: sql.VarChar(30),
                    CoCd: sql.VarChar(30),
                    OldSPId: sql.VarChar(30),
                    ModUsr: sql.VarChar(5),
                    ModTime: sql.Numeric(5, 2)
                },
                inputValuesMap: {
                    SPId: spId,
                    Name: name,
                    CoCd: coCd,
                    OldSPId: oldSpId,
                    ModUsr: user,
                    ModTime: modTime
                },
                returnRaw: true
            };

            const result = await execute(conn, updateQuery);
            if (result.rowsAffected[0] === 0) {
                throw new Error('Record not found or no changes made');
            }
            return { message: 'Sales Person updated successfully' };
        }
    },

    deleteData: {
        rawQuery: `DELETE FROM [${process.env.yDb}].[dbo].[yparam] WHERE PTyp = 'SP' AND PMCd = @SPId`,
        inputTypeMap: {
            SPId: sql.VarChar(30)
        },
        prepareInputValues: (body) => ({
            SPId: (body.SPId || '').trim()
        })
    }
};
