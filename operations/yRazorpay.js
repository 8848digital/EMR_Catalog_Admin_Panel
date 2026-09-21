require('dotenv').config();
const sql = require('mssql');

module.exports = {
    label: 'Manage Razorpay',

    getData: {
        selectClause: `
            RTRIM(LTRIM(PMCd)) AS machinName,
            RTRIM(LTRIM(PSCd)) AS serialNum,
            REPLACE(REPLACE(RTRIM(LTRIM(PDesc)), CHAR(13), ''), CHAR(10), '') AS apiUserID,
            REPLACE(REPLACE(RTRIM(LTRIM(PDesc225)), CHAR(13), ''), CHAR(10), '') AS appKey,
            RTRIM(LTRIM(PValue)) AS Cocd
        `,
        from: `[${process.env.yDb}].[dbo].[yparam]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "PValue, PMCd",
        inputTypeMap: {
            PTyp: sql.VarChar(20)
        },
        inputValuesMap: {
            PTyp: 'RP'
        }
    },

    addData: {
        validate: (body) => {
            if (!body.machinName || !body.machinName.trim()) throw new Error('Machine Name is required');
            if (!body.serialNum || !body.serialNum.trim()) throw new Error('Serial Number is required');
            if (!body.apiUserID || !body.apiUserID.trim()) throw new Error('API User ID is required');
            if (!body.appKey || !body.appKey.trim()) throw new Error('App Key is required');
            if (!body.Cocd || !body.Cocd.trim()) throw new Error('Company Code (Cocd) is required');
            return true;
        },

        rawQuery: `
            INSERT INTO [${process.env.yDb}].[dbo].[yparam]
            (PTyp, PMCd, PSCd, PDesc, PDesc225, PValue, PNum, PValue1, PNum1, PValue2, ModUsr, ModDt, ModTime, PValue3, PValidYn, PPrtKey)
            VALUES 
            ('RP', @machinName, @serialNum, @apiUserID, @appKey, @Cocd, 0, '', 0, '', @ModUsr, GETDATE(), @ModTime, '', '', 'C')
        `,

        inputTypeMap: {
            machinName: sql.VarChar(30),
            serialNum: sql.VarChar(30),
            apiUserID: sql.VarChar(30),
            appKey: sql.VarChar(225),
            Cocd: sql.VarChar(30),
            ModUsr: sql.VarChar(5),
            ModTime: sql.Numeric(5, 2)
        },

        prepareInputValues: (body, modUsr) => {
            const now = new Date();
            const modTime = parseFloat(`${now.getHours()}.${now.getMinutes().toString().padStart(2, '0')}`) || 0;
            return {
                machinName: body.machinName.trim(),
                serialNum: body.serialNum.trim(),
                apiUserID: body.apiUserID.trim(),
                appKey: body.appKey.trim(),
                Cocd: body.Cocd.trim(),
                ModUsr: (body.modUsr || modUsr || 'ADM').substring(0, 5),
                ModTime: modTime
            };
        }
    },

    updateData: {
        validate: (body) => {
            if (!body.machinName || !body.machinName.trim()) throw new Error('Machine Name is required');
            if (!body.serialNum || !body.serialNum.trim()) throw new Error('Serial Number is required');
            if (!body.apiUserID || !body.apiUserID.trim()) throw new Error('API User ID is required');
            if (!body.appKey || !body.appKey.trim()) throw new Error('App Key is required');
            if (!body.Cocd || !body.Cocd.trim()) throw new Error('Company Code (Cocd) is required');
            if (!body.OldMachinName || !body.OldMachinName.trim()) throw new Error('Original Machine Name is required');
            if (!body.OldSerialNum || !body.OldSerialNum.trim()) throw new Error('Original Serial Number is required');
            return true;
        },

        rawQuery: `
            UPDATE [${process.env.yDb}].[dbo].[yparam]
            SET 
                PMCd = @machinName,
                PSCd = @serialNum,
                PDesc = @apiUserID,
                PDesc225 = @appKey,
                PValue = @Cocd,
                ModUsr = @ModUsr,
                ModDt = GETDATE(),
                ModTime = @ModTime
            WHERE PTyp = 'RP' AND PMCd = @OldMachinName AND PSCd = @OldSerialNum
        `,

        inputTypeMap: {
            machinName: sql.VarChar(30),
            serialNum: sql.VarChar(30),
            apiUserID: sql.VarChar(30),
            appKey: sql.VarChar(225),
            Cocd: sql.VarChar(30),
            OldMachinName: sql.VarChar(30),
            OldSerialNum: sql.VarChar(30),
            ModUsr: sql.VarChar(5),
            ModTime: sql.Numeric(5, 2)
        },

        prepareInputValues: (body, modUsr) => {
            const now = new Date();
            const modTime = parseFloat(`${now.getHours()}.${now.getMinutes().toString().padStart(2, '0')}`) || 0;
            return {
                machinName: body.machinName.trim(),
                serialNum: body.serialNum.trim(),
                apiUserID: body.apiUserID.trim(),
                appKey: body.appKey.trim(),
                Cocd: body.Cocd.trim(),
                OldMachinName: body.OldMachinName.trim(),
                OldSerialNum: body.OldSerialNum.trim(),
                ModUsr: (body.modUsr || modUsr || 'ADM').substring(0, 5),
                ModTime: modTime
            };
        }
    },

    deleteData: {
        rawQuery: `DELETE FROM [${process.env.yDb}].[dbo].[yparam] WHERE PTyp = 'RP' AND PMCd = @machinName AND PSCd = @serialNum`,
        inputTypeMap: {
            machinName: sql.VarChar(30),
            serialNum: sql.VarChar(30)
        },
        prepareInputValues: (body) => ({
            machinName: (body.machinName || '').trim(),
            serialNum: (body.serialNum || '').trim()
        })
    }
};
