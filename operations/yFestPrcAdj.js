const sql = require('mssql');

module.exports = {
    label: 'Festival Price Adjustment',

    getData: {
        selectClause: `
            FpIdNo,
            RTRIM(LTRIM(FpBaseCd)) AS FpBaseCd,
            FpMetal,
            FpAlwPct,
            CONVERT(varchar(10), FpFrDt, 23) AS FpFrDt,
            CONVERT(varchar(10), FpToDt, 23) AS FpToDt,
            CONVERT(varchar(19), CrDt, 120) AS CrDt
        `,
        from: `[${process.env.yDb}].[dbo].[yFestPrcAdj]`,
        whereConditions: [],
        orderByClause: 'FpIdNo DESC',
        inputTypeMap: {},
        inputValuesMap: {}
    },

    addData: {
        validate: (body) => {
            const { FpBaseCd, FpMetal, FpAlwPct, FpFrDt, FpToDt } = body;
            if (!FpBaseCd || !FpBaseCd.trim()) throw new Error('Base Code (FpBaseCd) is required');
            if (!FpMetal || !['G', 'S'].includes(FpMetal.trim().toUpperCase()))
                throw new Error('Metal (FpMetal) must be G or S');
            const pct = parseFloat(FpAlwPct);
            if (isNaN(pct) || pct === 0 || pct <= -1 || pct >= 1)
                throw new Error('Allow % (FpAlwPct) must be non-zero and between -1 and 1 (exclusive)');
            if (!FpFrDt) throw new Error('From Date (FpFrDt) is required');
            if (!FpToDt) throw new Error('To Date (FpToDt) is required');
            if (new Date(FpToDt) < new Date(FpFrDt))
                throw new Error('To Date must be >= From Date');
            return true;
        },

        rawQuery: `
            INSERT INTO [${process.env.yDb}].[dbo].[yFestPrcAdj]
            (FpBaseCd, FpMetal, FpAlwPct, FpFrDt, FpToDt)
            VALUES
            (@FpBaseCd, @FpMetal, @FpAlwPct, @FpFrDt, @FpToDt)
        `,

        inputTypeMap: {
            FpBaseCd: sql.VarChar(10),
            FpMetal:  sql.Char(1),
            FpAlwPct: sql.Decimal(9, 6),
            FpFrDt:   sql.Date,
            FpToDt:   sql.Date
        },

        prepareInputValues: (body) => ({
            FpBaseCd: body.FpBaseCd.trim().toUpperCase(),
            FpMetal:  body.FpMetal.trim().toUpperCase(),
            FpAlwPct: parseFloat(body.FpAlwPct),
            FpFrDt:   body.FpFrDt,
            FpToDt:   body.FpToDt
        })
    },

    updateData: {
        validate: (body) => {
            const { FpIdNo, FpBaseCd, FpMetal, FpAlwPct, FpFrDt, FpToDt } = body;
            if (!FpIdNo) throw new Error('FpIdNo is required for update');
            if (!FpBaseCd || !FpBaseCd.trim()) throw new Error('Base Code (FpBaseCd) is required');
            if (!FpMetal || !['G', 'S'].includes(FpMetal.trim().toUpperCase()))
                throw new Error('Metal (FpMetal) must be G or S');
            const pct = parseFloat(FpAlwPct);
            if (isNaN(pct) || pct === 0 || pct <= -1 || pct >= 1)
                throw new Error('Allow % (FpAlwPct) must be non-zero and between -1 and 1 (exclusive)');
            if (!FpFrDt) throw new Error('From Date (FpFrDt) is required');
            if (!FpToDt) throw new Error('To Date (FpToDt) is required');
            if (new Date(FpToDt) < new Date(FpFrDt))
                throw new Error('To Date must be >= From Date');
            return true;
        },

        rawQuery: `
            UPDATE [${process.env.yDb}].[dbo].[yFestPrcAdj]
            SET
                FpBaseCd = @FpBaseCd,
                FpMetal  = @FpMetal,
                FpAlwPct = @FpAlwPct,
                FpFrDt   = @FpFrDt,
                FpToDt   = @FpToDt
            WHERE FpIdNo = @FpIdNo
        `,

        inputTypeMap: {
            FpIdNo:   sql.BigInt,
            FpBaseCd: sql.VarChar(10),
            FpMetal:  sql.Char(1),
            FpAlwPct: sql.Decimal(9, 6),
            FpFrDt:   sql.Date,
            FpToDt:   sql.Date
        },

        prepareInputValues: (body) => ({
            FpIdNo:   parseInt(body.FpIdNo),
            FpBaseCd: body.FpBaseCd.trim().toUpperCase(),
            FpMetal:  body.FpMetal.trim().toUpperCase(),
            FpAlwPct: parseFloat(body.FpAlwPct),
            FpFrDt:   body.FpFrDt,
            FpToDt:   body.FpToDt
        })
    },

    deleteData: {
        rawQuery: `DELETE FROM [${process.env.yDb}].[dbo].[yFestPrcAdj] WHERE FpIdNo = @FpIdNo`,
        inputTypeMap: { FpIdNo: sql.BigInt },
        prepareInputValues: (body) => ({ FpIdNo: parseInt(body.FpIdNo) })
    }
};
