const sql = require('mssql');

module.exports = {
    label: 'Manage Email',

    useDatabase: 'yDb',
    
    getData: {
        selectClause: `
        PTyp,
        PMCd,
        PSCd,
        PDesc,
        PDesc225
      `,
        from: (dbName) => `[${dbName}].[dbo].[yParam]`,
        whereConditions: ["PTyp = @PTyp", "PMCd = @PMCd"],
        orderByClause: "PSCd",
        inputTypeMap: {
            PTyp: sql.VarChar(50),
            PMCd: sql.VarChar(50)
        },
        inputValuesMap: {
            PTyp: 'yCfg',
            PMCd: 'MlCfg'
        }
    },
    updateData: {
        validate: (body) => {
            const { PDesc, PDesc225 } = body;

            if (!PDesc || !PDesc225 || PDesc225.trim() === '') {
                throw new Error('Email address is required');
            }
            return true;
        },

        customUpdate: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const dbName = process.env.yDb;
            const { PDesc, PDesc225, OldPDesc225 } = body;

            const newEmail = PDesc225.trim().toLowerCase();
            const oldEmail = (OldPDesc225 || '').trim().toLowerCase();

            // Check if email is being changed
            if (newEmail !== oldEmail) {
                const checkDuplicateQuery = {
                    rawQuery: `
              SELECT COUNT(*) as Count
              FROM [${dbName}].[dbo].[yParam]
              WHERE PTyp = 'yCfg' 
                AND PMCd = 'MlCfg'
                AND PDesc = @PDesc
                AND LOWER(PDesc225) = @PDesc225
            `,
                    inputTypeMap: {
                        PDesc: sql.VarChar(30),
                        PDesc225: sql.VarChar(225)
                    },
                    inputValuesMap: {
                        PDesc: PDesc,
                        PDesc225: newEmail
                    }
                };

                const duplicateResult = await exeQuery(conn, checkDuplicateQuery);
                if (duplicateResult[0]?.Count > 0) {
                    throw new Error(`Email ID "${PDesc225.trim()}" already exists in "${PDesc}" category`);
                }
            }

            const queryStmts = {
                rawQuery: `
            UPDATE [${dbName}].[dbo].[yParam]
            SET 
              PDesc225 = @PDesc225,
              ModUsr = @ModUsr,
              ModDt = GETDATE(),
              ModTime = @ModTime
            WHERE PTyp = 'yCfg' 
              AND PMCd = 'MlCfg'
              AND PDesc = @PDesc
              AND LOWER(PDesc225) = @OldPDesc225
          `,
                inputTypeMap: {
                    PDesc: sql.VarChar(30),
                    PDesc225: sql.VarChar(225),
                    OldPDesc225: sql.VarChar(225),
                    ModUsr: sql.VarChar(5),
                    ModTime: sql.Numeric(5, 2)
                },
                inputValuesMap: {
                    PDesc: PDesc,
                    PDesc225: PDesc225.trim(),
                    OldPDesc225: oldEmail,
                    ModUsr: modUsr.substring(0, 5),
                    ModTime: 0.00
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, queryStmts);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Email configuration not found or no changes made');
            }

            return {
                message: 'Email configuration updated successfully',
                PDesc,
                PDesc225: PDesc225.trim()
            };
        }
    },
    addData: {
        validate: (body) => {
            const { PDesc, PDesc225 } = body;

            if (!PDesc || (PDesc !== 'to' && PDesc !== 'cc')) {
                throw new Error('Mail must be either "to" or "cc"');
            }
            if (!PDesc225 || PDesc225.trim() === '') {
                throw new Error('Email address is required');
            }
            return true;
        },
        customAdd: async (conn, body, modUsr) => {
            const { sql, exeQuery } = conn;
            const dbName = process.env.yDb;
            const { PDesc, PDesc225 } = body;

            const emailToCheck = PDesc225.trim().toLowerCase();


            const checkDuplicateQuery = {
                rawQuery: `
            SELECT COUNT(*) as Count
            FROM [${dbName}].[dbo].[yParam]
            WHERE PTyp = 'yCfg' 
              AND PMCd = 'MlCfg'
              AND PDesc = @PDesc
              AND LOWER(PDesc225) = @PDesc225
          `,
                inputTypeMap: {
                    PDesc: sql.VarChar(30),
                    PDesc225: sql.VarChar(225)
                },
                inputValuesMap: {
                    PDesc: PDesc,
                    PDesc225: emailToCheck
                }
            };

            const duplicateResult = await exeQuery(conn, checkDuplicateQuery);
            if (duplicateResult[0]?.Count > 0) {
                throw new Error(`Email ID "${PDesc225.trim()}" already exists in "${PDesc}" category`);
            }

            const getMaxPSCdQuery = {
                rawQuery: `
            SELECT ISNULL(MAX(CAST(PSCd AS INT)), 0) + 1 AS NextPSCd
            FROM [${dbName}].[dbo].[yParam]
            WHERE PTyp = 'yCfg' 
              AND PMCd = 'MlCfg'
              AND PDesc = @PDesc
          `,
                inputTypeMap: {
                    PDesc: sql.VarChar(30)
                },
                inputValuesMap: {
                    PDesc: PDesc
                }
            };

            const maxResult = await exeQuery(conn, getMaxPSCdQuery);
            const nextPSCd = maxResult[0]?.NextPSCd || 1;

            const insertQuery = {
                rawQuery: `
            INSERT INTO [${dbName}].[dbo].[yParam]
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
                    PTyp: 'yCfg',
                    PMCd: 'MlCfg',
                    PSCd: nextPSCd.toString(),
                    PDesc: PDesc,
                    PDesc225: PDesc225.trim(),
                    PValue: '',
                    PNum: 0,
                    PValue1: '',
                    PNum1: 0,
                    PValue2: '',
                    ModUsr: modUsr.substring(0, 5),
                    ModTime: 0.00,
                    PValue3: '1',
                    PValidYn: '',
                    PPrtKey: 'C'
                },
                returnRaw: true
            };

            const result = await exeQuery(conn, insertQuery);

            if (result.rowsAffected[0] === 0) {
                throw new Error('Failed to add email configuration');
            }

            return {
                message: 'Email configuration added successfully',
                PTyp: 'yCfg',
                PMCd: 'MlCfg',
                PSCd: nextPSCd.toString(),
                PDesc: PDesc
            };
        }
    }
};