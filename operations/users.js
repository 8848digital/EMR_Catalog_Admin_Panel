const sql = require('mssql');

module.exports = {
    label: 'Manage Users',

    getPMCdList: {
        selectClause: `
            PSCd,
            PDesc
        `,
        from: () => `[${process.env.DB_DATABASE}].[dbo].[Param]`,
        whereConditions: ["PTyp = @PTyp", "PMCd = @PMCd"],
        orderByClause: "PSCd",
        inputTypeMap: {
            PTyp: sql.VarChar(50),
            PMCd: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'daanacd',
            PMCd: '7'
        }
    },

    getData: {
        selectClause: `
            UserName,
            SyncStock,
            Verticals
        `,
        from: () => `[${process.env.yDb}].[dbo].[Users]`,
        whereConditions: [],
        orderByClause: "UserName",
        inputTypeMap: {},
        inputValuesMap: {}
    },

    updateData: {
        validate: (body) => {
            const { UserName, SyncStock, OldUserName } = body;

            if (!UserName || UserName.trim() === '') {
                throw new Error('UserName is required');
            }
            if (SyncStock === undefined || SyncStock === null) {
                throw new Error('SyncStock is required');
            }
            if (!OldUserName) {
                throw new Error('Original UserName (OldUserName) is required');
            }
            return true;
        },

        customUpdate: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { UserName, SyncStock, Verticals, OldUserName } = body;

            const newUserName = UserName.trim();
            const oldUserName = OldUserName.trim();
            const newSyncStock = SyncStock ? 1 : 0;
            const newVerticals = Verticals ? Verticals.trim() : null;

            const isUserNameChanged = newUserName !== oldUserName;

            if (isUserNameChanged) {
                const checkDuplicateQuery = {
                    rawQuery: `
                        SELECT COUNT(*) as Count
                        FROM [${process.env.yDb}].[dbo].[Users]
                        WHERE UserName = @NewUserName
                    `,
                    inputTypeMap: {
                        NewUserName: sql.VarChar(50)
                    },
                    inputValuesMap: {
                        NewUserName: newUserName
                    }
                };

                const duplicateResult = await exeQuery(conn, checkDuplicateQuery);
                if (duplicateResult[0]?.Count > 0) {
                    throw new Error(`UserName "${newUserName}" already exists`);
                }
            }

            const updateQuery = {
                rawQuery: `
                    UPDATE [${process.env.yDb}].[dbo].[Users]
                    SET 
                        UserName = @NewUserName,
                        SyncStock = @SyncStock,
                        Verticals = @Verticals,
                        ModDt = GETDATE()
                    WHERE UserName = @OldUserName
                `,
                inputTypeMap: {
                    NewUserName: sql.VarChar(50),
                    SyncStock: sql.Bit,
                    Verticals: sql.VarChar(255),
                    OldUserName: sql.VarChar(50)
                },
                inputValuesMap: {
                    NewUserName: newUserName,
                    SyncStock: newSyncStock,
                    Verticals: newVerticals,
                    OldUserName: oldUserName
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, updateQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('User not found or no changes made');
            }

            return {
                message: 'User updated successfully',
                UserName: newUserName,
                SyncStock: newSyncStock,
                Verticals: newVerticals
            };
        }
    },

    addData: {
        validate: (body) => {
            const { UserName } = body;
            if (!UserName || UserName.trim() === '') {
                throw new Error('UserName is required');
            }
            return true;
        },

        customAdd: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { UserName, SyncStock, Verticals } = body;

            const trimmedUserName = UserName.trim();
            const syncStockVal = SyncStock ? 1 : 0;
            const trimmedVerticals = Verticals ? Verticals.trim() : null;

            // Check duplicate
            const checkDuplicateQuery = {
                rawQuery: `
                    SELECT COUNT(*) as Count
                    FROM [${process.env.yDb}].[dbo].[Users]
                    WHERE UserName = @UserName
                `,
                inputTypeMap: { UserName: sql.VarChar(50) },
                inputValuesMap: { UserName: trimmedUserName }
            };

            const duplicateResult = await exeQuery(conn, checkDuplicateQuery);
            if (duplicateResult[0]?.Count > 0) {
                throw new Error(`UserName "${trimmedUserName}" already exists`);
            }

            const insertQuery = {
                rawQuery: `
                    INSERT INTO [${process.env.yDb}].[dbo].[Users]
                    (UserName, SyncStock, Verticals, CreatedAt, ModDt)
                    VALUES
                    (@UserName, @SyncStock, @Verticals, GETDATE(), GETDATE())
                `,
                inputTypeMap: {
                    UserName: sql.VarChar(50),
                    SyncStock: sql.Bit,
                    Verticals: sql.VarChar(255)
                },
                inputValuesMap: {
                    UserName: trimmedUserName,
                    SyncStock: syncStockVal,
                    Verticals: trimmedVerticals
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, insertQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Failed to add User');
            }

            return {
                message: 'User added successfully',
                UserName: trimmedUserName
            };
        }
    },

    deleteData: {
        customDelete: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const { UserName } = body;

            if (!UserName) {
                throw new Error('UserName is required for deletion');
            }

            const deleteQuery = {
                rawQuery: `
                    DELETE FROM [${process.env.yDb}].[dbo].[Users]
                    WHERE UserName = @UserName
                `,
                inputTypeMap: {
                    UserName: sql.VarChar(50)
                },
                inputValuesMap: {
                    UserName: UserName.trim()
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, deleteQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('User not found');
            }

            return {
                message: 'User deleted successfully'
            };
        }
    }
};