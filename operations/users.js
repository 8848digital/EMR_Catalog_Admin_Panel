const sql = require('mssql');

module.exports = {
    label: 'Manage Users',

    getData: {
        selectClause: `
            UserName,
            EmrMapUser,
            UserAbbreviation,
            location,
            CoCd,
            MaxItemDiscPer,
            MaxSalesDiscPer
        `,
        from: () => `[${process.env.yDb}].[dbo].[Users]`,
        whereConditions: [],
        orderByClause: "UserName",
        inputTypeMap: {},
        inputValuesMap: {}
    },

    updateData: {
        validate: (body) => {
            const { UserName, OldUserName } = body;

            if (!UserName || UserName.trim() === '') {
                throw new Error('UserName is required');
            }
            if (!OldUserName) {
                throw new Error('Original UserName (OldUserName) is required');
            }
            return true;
        },

        customUpdate: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const {
                UserName,
                EmrMapUser,
                location,
                CoCd,
                MaxItemDiscPer,
                MaxSalesDiscPer,
                OldUserName
            } = body;

            const newUserName = UserName.trim();
            const oldUserName = OldUserName.trim();

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
                        EmrMapUser = @EmrMapUser,
                        location = @location,
                        CoCd = @CoCd,
                        MaxItemDiscPer = @MaxItemDiscPer,
                        MaxSalesDiscPer = @MaxSalesDiscPer,
                        ModDt = GETDATE()
                    WHERE UserName = @OldUserName
                `,
                inputTypeMap: {
                    NewUserName: sql.VarChar(50),
                    EmrMapUser: sql.VarChar(50),
                    location: sql.VarChar(15),
                    CoCd: sql.VarChar(5),
                    MaxItemDiscPer: sql.VarChar(10),
                    MaxSalesDiscPer: sql.VarChar(10),
                    OldUserName: sql.VarChar(50)
                },
                inputValuesMap: {
                    NewUserName: newUserName,
                    EmrMapUser: EmrMapUser || null,
                    location: location || null,
                    CoCd: CoCd || null,
                    MaxItemDiscPer: MaxItemDiscPer || null,
                    MaxSalesDiscPer: MaxSalesDiscPer || null,
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
                UserName: newUserName
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
            const {
                UserName,
                EmrMapUser,
                location,
                CoCd,
                MaxItemDiscPer,
                MaxSalesDiscPer
            } = body;

            const trimmedUserName = UserName.trim();

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
                    (UserName, EmrMapUser, location, CoCd, MaxItemDiscPer, MaxSalesDiscPer, CreatedAt, ModDt, SyncStock)
                    VALUES
                    (@UserName, @EmrMapUser, @location, @CoCd, @MaxItemDiscPer, @MaxSalesDiscPer, GETDATE(), GETDATE(), 1)
                `,
                inputTypeMap: {
                    UserName: sql.VarChar(50),
                    EmrMapUser: sql.VarChar(50),
                    location: sql.VarChar(15),
                    CoCd: sql.VarChar(5),
                    MaxItemDiscPer: sql.VarChar(10),
                    MaxSalesDiscPer: sql.VarChar(10)
                },
                inputValuesMap: {
                    UserName: trimmedUserName,
                    EmrMapUser: EmrMapUser || null,
                    location: location || null,
                    CoCd: CoCd || null,
                    MaxItemDiscPer: MaxItemDiscPer || null,
                    MaxSalesDiscPer: MaxSalesDiscPer || null
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