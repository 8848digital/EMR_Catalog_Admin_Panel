const sql = require('mssql');

module.exports = {
    label: 'Manage Discount Slabs',

    getData: {
        selectClause: `
            PMCd AS RuleCode,
            PSCd AS ValueMode,
            PDesc AS TierName,
            PValue AS MinValue,
            PNum AS TierOrder,
            PValue1 AS MaxValue,
            PNum1 AS DiscountValue
        `,
        from: `[${process.env.yDb}].[dbo].[yParam]`,
        whereConditions: ["PTyp = @PTyp"],
        orderByClause: "PMCd, PNum",
        inputTypeMap: {
            PTyp: sql.VarChar(20)
        },
        inputValuesMap: {
            PTyp: 'yDiscSlb'
        }
    },

    addData: {
        validate: (body) => {
            const { RuleCode, ValueMode, MinValue, MaxValue, DiscountValue, TierOrder } = body;
            if (!RuleCode) throw new Error('Rule Code (PMCd) is required');
            if (!ValueMode) throw new Error('Value Mode (PSCd) is required');
            if (MinValue === undefined) throw new Error('Min Value is required');
            if (MaxValue === undefined) throw new Error('Max Value is required');
            if (DiscountValue === undefined) throw new Error('Discount Value is required');
            if (TierOrder === undefined) throw new Error('Tier Order is required');
            return true;
        },

        rawQuery: `
            INSERT INTO [${process.env.yDb}].[dbo].[yParam]
            (PTyp, PMCd, PSCd, PDesc, PDesc225, PValue, PNum, PValue1, PNum1, PValue2, ModUsr, ModDt, ModTime, PValue3, PValidYn, PPrtKey)
            VALUES 
            ('yDiscSlb', @RuleCode, @ValueMode, @TierName, '', @MinValue, @TierOrder, @MaxValue, @DiscountValue, '', @ModUsr, GETDATE(), 0, '', 'Y', 'N')
        `,

        inputTypeMap: {
            RuleCode: sql.VarChar(30),
            ValueMode: sql.VarChar(30),
            TierName: sql.VarChar(30),
            MinValue: sql.VarChar(30),
            TierOrder: sql.Float,
            MaxValue: sql.VarChar(120),
            DiscountValue: sql.Float,
            ModUsr: sql.VarChar(5)
        },

        prepareInputValues: (body, modUsr) => ({
            RuleCode: body.RuleCode,
            ValueMode: body.ValueMode,
            TierName: body.TierName || '',
            MinValue: body.MinValue.toString(),
            TierOrder: parseFloat(body.TierOrder),
            MaxValue: body.MaxValue.toString(),
            DiscountValue: parseFloat(body.DiscountValue),
            ModUsr: modUsr.substring(0, 5)
        })
    },

    updateData: {
        validate: (body) => {
            if (!body.RuleCode) throw new Error('Rule Code is required');
            if (body.TierOrder === undefined) throw new Error('Tier Order is required');
            if (!body.OldRuleCode) throw new Error('Original Rule Code is required');
            if (body.OldTierOrder === undefined) throw new Error('Original Tier Order is required');
            return true;
        },

        rawQuery: `
            UPDATE [${process.env.yDb}].[dbo].[yParam]
            SET 
                PMCd = @RuleCode,
                PSCd = @ValueMode,
                PDesc = @TierName,
                PValue = @MinValue,
                PNum = @TierOrder,
                PValue1 = @MaxValue,
                PNum1 = @DiscountValue,
                ModUsr = @ModUsr,
                ModDt = GETDATE(),
                ModTime = 0
            WHERE PTyp = 'yDiscSlb' AND PMCd = @OldRuleCode AND PNum = @OldTierOrder
        `,

        inputTypeMap: {
            RuleCode: sql.VarChar(30),
            ValueMode: sql.VarChar(30),
            TierName: sql.VarChar(30),
            MinValue: sql.VarChar(30),
            TierOrder: sql.Float,
            MaxValue: sql.VarChar(120),
            DiscountValue: sql.Float,
            OldRuleCode: sql.VarChar(30),
            OldTierOrder: sql.Float,
            ModUsr: sql.VarChar(5)
        },

        prepareInputValues: (body, modUsr) => ({
            RuleCode: body.RuleCode,
            ValueMode: body.ValueMode,
            TierName: body.TierName || '',
            MinValue: body.MinValue.toString(),
            TierOrder: parseFloat(body.TierOrder),
            MaxValue: body.MaxValue.toString(),
            DiscountValue: parseFloat(body.DiscountValue),
            OldRuleCode: body.OldRuleCode,
            OldTierOrder: parseFloat(body.OldTierOrder),
            ModUsr: modUsr.substring(0, 5)
        })
    },

    deleteData: {
        rawQuery: `DELETE FROM [${process.env.yDb}].[dbo].[yParam] WHERE PTyp = 'yDiscSlb' AND PMCd = @RuleCode AND PNum = @TierOrder`,
        inputTypeMap: {
            RuleCode: sql.VarChar(30),
            TierOrder: sql.Float
        },
        prepareInputValues: (body) => ({
            RuleCode: body.RuleCode,
            TierOrder: parseFloat(body.TierOrder)
        })
    }
};
