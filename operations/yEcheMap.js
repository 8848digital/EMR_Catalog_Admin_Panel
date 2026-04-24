const sql = require('mssql');

module.exports = {
    label: 'Manage Echelon Mappings',

    getData: {
        selectClause: `
            PMCd AS RuleCode,
            PSCd AS EchelonType,
            PValue AS TargetValue,
            PDesc AS Description
        `,
        from: `[${process.env.yDb}].[dbo].[yParam]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "PMCd, PValue",
        inputTypeMap: {
            PTyp: sql.VarChar(20)
        },
        inputValuesMap: {
            PTyp: 'yEcheMap'
        }
    },

    addData: {
        validate: (body) => {
            const { RuleCode, EchelonType, TargetValue } = body;
            if (!RuleCode) throw new Error('Rule Code is required');
            if (!EchelonType) throw new Error('Echelon Type is required');
            if (!TargetValue) throw new Error('Target Value is required');
            return true;
        },

        rawQuery: `
            INSERT INTO [${process.env.yDb}].[dbo].[yParam]
            (PTyp, PMCd, PSCd, PDesc, PDesc225, PValue, PNum, PValue1, PNum1, PValue2, ModUsr, ModDt, ModTime, PValue3, PValidYn, PPrtKey)
            VALUES 
            ('yEcheMap', @RuleCode, @EchelonType, @Description, '', @TargetValue, 0, '', 0, '', @ModUsr, GETDATE(), 0, '', 'Y', 'N')
        `,

        inputTypeMap: {
            RuleCode: sql.VarChar(30),
            EchelonType: sql.VarChar(30),
            Description: sql.VarChar(30),
            TargetValue: sql.VarChar(30),
            ModUsr: sql.VarChar(5)
        },

        prepareInputValues: (body) => ({
            RuleCode: body.RuleCode || '',
            EchelonType: body.EchelonType || '',
            Description: body.Description || '',
            TargetValue: body.TargetValue || '',
            ModUsr: 'ADM'
        })
    },

    updateData: {
        validate: (body) => {
            if (!body.RuleCode) throw new Error('Rule Code is required');
            if (!body.EchelonType) throw new Error('Echelon Type is required');
            if (!body.TargetValue) throw new Error('Target Value is required');
            if (!body.OldRuleCode) throw new Error('Original Rule Code is required');
            if (!body.OldTargetValue) throw new Error('Original Target Value is required');
            return true;
        },

        rawQuery: `
            UPDATE [${process.env.yDb}].[dbo].[yParam]
            SET 
                PMCd = @RuleCode,
                PSCd = @EchelonType,
                PValue = @TargetValue,
                PDesc = @Description,
                ModUsr = @ModUsr,
                ModDt = GETDATE(),
                ModTime = 0
            WHERE PTyp = 'yEcheMap' AND PMCd = @OldRuleCode AND PValue = @OldTargetValue
        `,

        inputTypeMap: {
            RuleCode: sql.VarChar(30),
            EchelonType: sql.VarChar(30),
            TargetValue: sql.VarChar(30),
            Description: sql.VarChar(30),
            OldRuleCode: sql.VarChar(30),
            OldTargetValue: sql.VarChar(30),
            ModUsr: sql.VarChar(5)
        },

        prepareInputValues: (body) => ({
            RuleCode: body.RuleCode || '',
            EchelonType: body.EchelonType || '',
            TargetValue: body.TargetValue || '',
            Description: body.Description || '',
            OldRuleCode: body.OldRuleCode || '',
            OldTargetValue: body.OldTargetValue || '',
            ModUsr: 'ADM'
        })
    },

    deleteData: {
        rawQuery: `DELETE FROM [${process.env.yDb}].[dbo].[yParam] WHERE PTyp = 'yEcheMap' AND PMCd = @RuleCode AND PValue = @TargetValue`,
        inputTypeMap: {
            RuleCode: sql.VarChar(30),
            TargetValue: sql.VarChar(30)
        },
        prepareInputValues: (body) => ({
            RuleCode: body.RuleCode,
            TargetValue: body.TargetValue
        })
    }
};
