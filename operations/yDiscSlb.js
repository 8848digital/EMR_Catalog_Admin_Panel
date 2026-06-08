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
            if (!RuleCode) throw new Error('Rule Code is required');
            if (!ValueMode) throw new Error('Value Mode is required');
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

        prepareInputValues: (body) => ({
            RuleCode: body.RuleCode || '',
            ValueMode: body.ValueMode || '',
            TierName: body.TierName || '',
            MinValue: (body.MinValue ?? '').toString(),
            TierOrder: parseFloat(body.TierOrder || 0),
            MaxValue: (body.MaxValue ?? '').toString(),
            DiscountValue: parseFloat(body.DiscountValue || 0),
            ModUsr: 'ADM'
        })
    },

    updateData: {
        validate: (body) => {
            if (!body.RuleCode) throw new Error('Rule Code is required');
            if (body.MinValue === undefined || body.MinValue === null) throw new Error('Min Value is required');
            if (body.TierOrder === undefined || body.TierOrder === null) throw new Error('Tier Order is required');
            if (body.MaxValue === undefined || body.MaxValue === null) throw new Error('Max Value is required');
            if (body.DiscountValue === undefined || body.DiscountValue === null) throw new Error('Discount Value is required');
            if (body.OldRuleCode) {
                if (body.OldTierOrder === undefined || body.OldTierOrder === null) throw new Error('Original Tier Order is required');
                if (body.OldMinValue === undefined || body.OldMinValue === null) throw new Error('Original Min Value is required');
                if (body.OldMaxValue === undefined || body.OldMaxValue === null) throw new Error('Original Max Value is required');
                if (body.OldTierName === undefined || body.OldTierName === null) throw new Error('Original Tier Name is required');
                if (body.OldDiscountValue === undefined || body.OldDiscountValue === null) throw new Error('Original Discount Value is required');
            }
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
            WHERE PTyp = 'yDiscSlb' AND PMCd = @OldRuleCode AND PNum = @OldTierOrder AND PValue = @OldMinValue AND PValue1 = @OldMaxValue AND PDesc = @OldTierName AND PNum1 = @OldDiscountValue
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
            OldMinValue: sql.VarChar(30),
            OldMaxValue: sql.VarChar(120),
            OldTierName: sql.VarChar(30),
            OldDiscountValue: sql.Float,
            ModUsr: sql.VarChar(5)
        },

        prepareInputValues: (body) => ({
            RuleCode: body.RuleCode || '',
            ValueMode: body.ValueMode || '',
            TierName: body.TierName || '',
            MinValue: (body.MinValue ?? '').toString(),
            TierOrder: parseFloat(body.TierOrder || 0),
            MaxValue: (body.MaxValue ?? '').toString(),
            DiscountValue: parseFloat(body.DiscountValue || 0),
            OldRuleCode: body.OldRuleCode || '',
            OldTierOrder: parseFloat(body.OldTierOrder || 0),
            OldMinValue: (body.OldMinValue ?? '').toString(),
            OldMaxValue: (body.OldMaxValue ?? '').toString(),
            OldTierName: body.OldTierName || '',
            OldDiscountValue: parseFloat(body.OldDiscountValue || 0),
            ModUsr: 'ADM'
        })
    },

    deleteData: {
        rawQuery: `DELETE FROM [${process.env.yDb}].[dbo].[yParam] WHERE PTyp = 'yDiscSlb' AND PMCd = @RuleCode AND PNum = @TierOrder AND PValue = @MinValue AND PValue1 = @MaxValue AND PDesc = @TierName AND PNum1 = @DiscountValue`,
        inputTypeMap: {
            RuleCode: sql.VarChar(30),
            TierOrder: sql.Float,
            MinValue: sql.VarChar(30),
            MaxValue: sql.VarChar(120),
            TierName: sql.VarChar(30),
            DiscountValue: sql.Float
        },
        prepareInputValues: (body) => ({
            RuleCode: body.RuleCode,
            TierOrder: parseFloat(body.TierOrder),
            MinValue: (body.MinValue ?? '').toString(),
            MaxValue: (body.MaxValue ?? '').toString(),
            TierName: body.TierName || '',
            DiscountValue: parseFloat(body.DiscountValue || 0)
        })
    }
};
