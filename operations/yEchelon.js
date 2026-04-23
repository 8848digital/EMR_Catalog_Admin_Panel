const sql = require('mssql');

module.exports = {
    label: 'Manage Echelon Definitions',

    getData: {
        selectClause: `
            PMCd AS EchelonName,
            PValue AS ColumnMapping,
            PDesc AS Description
        `,
        from: `[${process.env.yDb}].[dbo].[yParam]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "ModDt DESC",
        inputTypeMap: {
            PTyp: sql.VarChar(20)
        },
        inputValuesMap: {
            PTyp: 'yEchelon'
        }
    },

    addData: {
        validate: (body) => {
            const { EchelonName, ColumnMapping } = body;
            if (!EchelonName) throw new Error('Echelon Name (PMCd) is required');
            if (!ColumnMapping) throw new Error('Column Mapping (PValue) is required');
            return true;
        },

        rawQuery: `
            INSERT INTO [${process.env.yDb}].[dbo].[yParam]
            (PTyp, PMCd, PValue, PDesc, PDesc225, PSCd, PNum, PValue1, PNum1, PValue2, ModUsr, ModDt, ModTime, PValue3, PValidYn, PPrtKey)
            VALUES 
            ('yEchelon', @EchelonName, @ColumnMapping, @Description, '', '', 0, '', 0, '', @ModUsr, GETDATE(), 0, '', 'Y', 'N')
        `,

        inputTypeMap: {
            EchelonName: sql.VarChar(30),
            ColumnMapping: sql.VarChar(30),
            Description: sql.VarChar(140),
            ModUsr: sql.VarChar(5)
        },

        prepareInputValues: (body, modUsr) => ({
            EchelonName: body.EchelonName || '',
            ColumnMapping: body.ColumnMapping || '',
            Description: body.Description || '',
            ModUsr: modUsr ? modUsr.substring(0, 5) : 'SYS'
        })
    },

    updateData: {
        validate: (body) => {
            if (!body.EchelonName) throw new Error('Echelon Name is required');
            if (!body.OldEchelonName) throw new Error('Original Echelon Name is required');
            return true;
        },

        rawQuery: `
            UPDATE [${process.env.yDb}].[dbo].[yParam]
            SET 
                PMCd = @EchelonName,
                PValue = @ColumnMapping,
                PDesc = @Description,
                PNum = 0,
                ModUsr = @ModUsr,
                ModDt = GETDATE(),
                ModTime = 0
            WHERE PTyp = 'yEchelon' AND PMCd = @OldEchelonName
        `,

        inputTypeMap: {
            EchelonName: sql.VarChar(30),
            ColumnMapping: sql.VarChar(30),
            Description: sql.VarChar(140),
            OldEchelonName: sql.VarChar(30),
            ModUsr: sql.VarChar(5)
        },

        prepareInputValues: (body, modUsr) => ({
            EchelonName: body.EchelonName || '',
            ColumnMapping: body.ColumnMapping || '',
            Description: body.Description || '',
            OldEchelonName: body.OldEchelonName || '',
            ModUsr: modUsr ? modUsr.substring(0, 5) : 'SYS'
        })
    },

    deleteData: {
        rawQuery: `DELETE FROM [${process.env.yDb}].[dbo].[yParam] WHERE PTyp = 'yEchelon' AND PMCd = @EchelonName`,
        inputTypeMap: { EchelonName: sql.VarChar(30) },
        prepareInputValues: (body) => ({ EchelonName: body.EchelonName })
    }
};
