const sql = require('mssql');

module.exports = {
    label: 'Manage Slab Basis',

    getData: {
        selectClause: `
            PMCd AS Code,
            PDesc AS Description
        `,
        from: `[${process.env.yDb}].[dbo].[yParam]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "PMCd",
        inputTypeMap: {
            PTyp: sql.VarChar(20)
        },
        inputValuesMap: {
            PTyp: 'ySlabBas'
        }
    },

    addData: {
        validate: (body) => {
            if (!body.Code) throw new Error('Code (PMCd) is required');
            if (!body.Description) throw new Error('Description (PDesc) is required');
            return true;
        },

        rawQuery: `
            INSERT INTO [${process.env.yDb}].[dbo].[yParam]
            (PTyp, PMCd, PSCd, PDesc, PDesc225, PValue, PNum, PValue1, PNum1, PValue2, ModUsr, ModDt, ModTime, PValue3, PValidYn, PPrtKey)
            VALUES 
            ('ySlabBas', @Code, '', @Description, '', '', 0, '', 0, '', @ModUsr, GETDATE(), 0, '', 'Y', 'N')
        `,

        inputTypeMap: {
            Code: sql.VarChar(30),
            Description: sql.VarChar(140),
            ModUsr: sql.VarChar(5)
        },

        prepareInputValues: (body, modUsr) => ({
            Code: body.Code,
            Description: body.Description,
            ModUsr: modUsr.substring(0, 5)
        })
    },

    updateData: {
        validate: (body) => {
            if (!body.Code) throw new Error('Code is required');
            if (!body.OldCode) throw new Error('Original Code is required');
            return true;
        },

        rawQuery: `
            UPDATE [${process.env.yDb}].[dbo].[yParam]
            SET 
                PMCd = @Code,
                PDesc = @Description,
                ModUsr = @ModUsr,
                ModDt = GETDATE(),
                ModTime = 0
            WHERE PTyp = 'ySlabBas' AND PMCd = @OldCode
        `,

        inputTypeMap: {
            Code: sql.VarChar(30),
            Description: sql.VarChar(140),
            OldCode: sql.VarChar(30),
            ModUsr: sql.VarChar(5)
        },

        prepareInputValues: (body, modUsr) => ({
            Code: body.Code,
            Description: body.Description,
            OldCode: body.OldCode,
            ModUsr: modUsr.substring(0, 5)
        })
    },

    deleteData: {
        rawQuery: `DELETE FROM [${process.env.yDb}].[dbo].[yParam] WHERE PTyp = 'ySlabBas' AND PMCd = @Code`,
        inputTypeMap: { Code: sql.VarChar(30) },
        prepareInputValues: (body) => ({ Code: body.Code })
    }
};
