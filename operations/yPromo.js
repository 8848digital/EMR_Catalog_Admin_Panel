const sql = require('mssql');

module.exports = {
    label: 'Manage Promotions',

    getData: {
        selectClause: `
            PMCd,
            PDesc,
            PValue AS StartDate,
            PValue1 AS EndDate,
            PValidYn
        `,
        from: `[${process.env.yDb}].[dbo].[yParam]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "ModDt DESC",
        inputTypeMap: {
            PTyp: sql.VarChar(20)
        },
        inputValuesMap: {
            PTyp: 'yPromo'
        }
    },

    addData: {
        validate: (body) => {
            const { PMCd, PDesc, StartDate, EndDate } = body;
            if (!PMCd) throw new Error('Promotion Code (PMCd) is required');
            if (!PDesc) throw new Error('Description (PDesc) is required');
            if (!StartDate) throw new Error('Start Date is required');
            if (!EndDate) throw new Error('End Date is required');
            return true;
        },

        rawQuery: `
            INSERT INTO [${process.env.yDb}].[dbo].[yParam]
            (PTyp, PMCd, PSCd, PDesc, PDesc225, PValue, PNum, PValue1, PNum1, PValue2, ModUsr, ModDt, ModTime, PValue3, PValidYn, PPrtKey)
            VALUES 
            ('yPromo', @PMCd, '', @PDesc, '', @StartDate, 0, @EndDate, 0, '', @ModUsr, GETDATE(), 0, '', @PValidYn, 'N')
        `,

        inputTypeMap: {
            PMCd: sql.VarChar(30),
            PDesc: sql.VarChar(140),
            StartDate: sql.VarChar(140),
            EndDate: sql.VarChar(140),
            PValidYn: sql.VarChar(1),
            ModUsr: sql.VarChar(5)
        },

        prepareInputValues: (body, modUsr) => ({
            PMCd: body.PMCd || '',
            PDesc: body.PDesc || '',
            StartDate: body.StartDate || '',
            EndDate: body.EndDate || '',
            PValidYn: body.PValidYn || 'Y',
            ModUsr: (modUsr || 'SYS').substring(0, 5)
        })
    },

    updateData: {
        validate: (body) => {
            if (!body.PMCd) throw new Error('Promotion Code (PMCd) is required');
            if (!body.StartDate) throw new Error('Start Date (PValue) is required');
            if (!body.EndDate) throw new Error('End Date (PValue1) is required');
            return true;
        },

        rawQuery: `
            UPDATE [${process.env.yDb}].[dbo].[yParam]
            SET 
                PSCd = '',
                PDesc = @PDesc,
                PValue = @StartDate,
                PValue1 = @EndDate,
                PValidYn = @PValidYn,
                ModUsr = @ModUsr,
                ModDt = GETDATE(),
                ModTime = 0
            WHERE PTyp = 'yPromo' AND PMCd = @PMCd
        `,

        inputTypeMap: {
            PMCd: sql.VarChar(30),
            PDesc: sql.VarChar(140),
            StartDate: sql.VarChar(140),
            EndDate: sql.VarChar(140),
            PValidYn: sql.VarChar(1),
            ModUsr: sql.VarChar(5)
        },

        prepareInputValues: (body, modUsr) => ({
            PMCd: body.PMCd || '',
            PDesc: body.PDesc || '',
            StartDate: body.StartDate || '',
            EndDate: body.EndDate || '',
            PValidYn: body.PValidYn || 'Y',
            ModUsr: (modUsr || 'SYS').substring(0, 5)
        })
    },

    deleteData: {
        rawQuery: `DELETE FROM [${process.env.yDb}].[dbo].[yParam] WHERE PTyp = 'yPromo' AND PMCd = @PMCd`,
        inputTypeMap: { PMCd: sql.VarChar(30) },
        prepareInputValues: (body) => ({ PMCd: body.PMCd })
    }
};
