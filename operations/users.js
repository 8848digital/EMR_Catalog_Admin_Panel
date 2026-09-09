const sql = require('mssql');

module.exports = {
    label: 'Manage Users',

    getData: {
        selectClause: `
            UserName,
            location,
            CoCd,
            EmrMapUser,
            Password,
            UserAbbreviation,
            isStoreMNG
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
            const targetUserName = OldUserName || UserName;

            if (!targetUserName || targetUserName.trim() === '') {
                throw new Error('UserName is required');
            }
            return true;
        },

        customUpdate: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const {
                UserName,
                location,
                CoCd,
                EmrMapUser,
                Password,
                isStoreMNG,
                OldUserName
            } = body;

            const oldUserName = (OldUserName || UserName || '').trim();
            const newUserName = (UserName || OldUserName || '').trim();

            if (!oldUserName) {
                throw new Error('Original UserName (OldUserName) is required');
            }
            if (!newUserName) {
                throw new Error('UserName is required');
            }

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

            const setClauses = [
                'UserName = @NewUserName',
                'ModDt = GETDATE()'
            ];
            const inputTypeMap = {
                NewUserName: sql.VarChar(50),
                OldUserName: sql.VarChar(50)
            };
            const inputValuesMap = {
                NewUserName: newUserName,
                OldUserName: oldUserName
            };

            if (location !== undefined) {
                setClauses.push('location = @location');
                inputTypeMap.location = sql.VarChar(15);
                inputValuesMap.location = location || null;
            }
            if (CoCd !== undefined) {
                setClauses.push('CoCd = @CoCd');
                inputTypeMap.CoCd = sql.VarChar(5);
                inputValuesMap.CoCd = CoCd || null;
            }
            if (EmrMapUser !== undefined) {
                setClauses.push('EmrMapUser = @EmrMapUser');
                inputTypeMap.EmrMapUser = sql.VarChar(50);
                inputValuesMap.EmrMapUser = EmrMapUser || null;
            }
            if (Password !== undefined) {
                setClauses.push('Password = @Password');
                inputTypeMap.Password = sql.VarChar(50);
                inputValuesMap.Password = Password || null;
            }
            if (isStoreMNG !== undefined) {
                setClauses.push('isStoreMNG = @isStoreMNG');
                inputTypeMap.isStoreMNG = sql.VarChar(5);
                inputValuesMap.isStoreMNG = isStoreMNG != null && String(isStoreMNG).trim() !== '' ? String(isStoreMNG).trim() : 'N';
            }

            const updateQuery = {
                rawQuery: `
                    UPDATE [${process.env.yDb}].[dbo].[Users]
                    SET 
                        ${setClauses.join(',\n                        ')}
                    WHERE UserName = @OldUserName
                `,
                inputTypeMap,
                inputValuesMap,
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
                location,
                CoCd,
                EmrMapUser,
                Password,
                isStoreMNG
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
                    (
                        UserName,
                        DefCurrency,
                        DefLang,
                        CreatedAt,
                        ModDt,
                        RefreshRt,
                        LabRt,
                        RMCtg,
                        SyncStock,
                        Verticals,
                        location,
                        CoCd,
                        EmrMapUser,
                        Password,
                        MaxItemDiscPer,
                        MaxSalesDiscPer,
                        isStoreMNG
                    )
                    VALUES
                    (
                        @UserName,
                        'Rs',
                        'EN',
                        GETDATE(),
                        GETDATE(),
                        0.00,
                        0.00,
                        '',
                        0,
                        '',
                        @location,
                        @CoCd,
                        @EmrMapUser,
                        @Password,
                        '20',
                        '20',
                        @isStoreMNG
                    )
                `,
                inputTypeMap: {
                    UserName: sql.VarChar(50),
                    location: sql.VarChar(15),
                    CoCd: sql.VarChar(5),
                    EmrMapUser: sql.VarChar(50),
                    Password: sql.VarChar(50),
                    isStoreMNG: sql.VarChar(5)
                },
                inputValuesMap: {
                    UserName: trimmedUserName,
                    location: location || null,
                    CoCd: CoCd || null,
                    EmrMapUser: EmrMapUser || null,
                    Password: Password || null,
                    isStoreMNG: isStoreMNG != null ? String(isStoreMNG).trim() : ''
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