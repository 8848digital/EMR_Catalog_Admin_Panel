const sql = require('mssql');

module.exports = {
    label: 'Manage Voucher Batches',

    getData: {
        selectClause: `
            VbIdNo,
            VbDcIdNo,
            VbCd,
            VbCtg,
            VbCrmTrig,
            VbTotVouchers,
            VbSingYN,
            VbMaxUse,
            VbOtpYN,
            CONVERT(VARCHAR(10), VbValidFrm, 120) AS VbValidFrm,
            CONVERT(VARCHAR(10), VbValidTo, 120) AS VbValidTo,
            VbValidYN
        `,
        from: `[${process.env.yDb}].[dbo].[voucherBatch]`,
        whereConditions: [],
        orderByClause: "VbIdNo DESC",
        inputTypeMap: {},
        inputValuesMap: {}
    },

    addData: {
        validate: (body) => {
            const { VbDcIdNo, VbCd, VbCtg, VbSingYN, VbMaxUse, VbOtpYN, VbValidFrm, VbValidTo, VbValidYN } = body;
            if (!VbDcIdNo) throw new Error('Discount ID Link (VbDcIdNo) is required');
            if (!VbCd) throw new Error('Batch Code (VbCd) is required');
            if (!VbCtg) throw new Error('Category (VbCtg) is required');
            if (!VbSingYN) throw new Error('Single Use Y/N (VbSingYN) is required');
            if (VbMaxUse === undefined) throw new Error('Max Use (VbMaxUse) is required');
            if (!VbOtpYN) throw new Error('OTP Y/N (VbOtpYN) is required');
            if (!VbValidFrm) throw new Error('Valid From Date is required');
            if (!VbValidTo) throw new Error('Valid To Date is required');
            if (!VbValidYN) throw new Error('Valid Y/N (VbValidYN) is required');
            return true;
        },

        rawQuery: `
            INSERT INTO [${process.env.yDb}].[dbo].[voucherBatch]
            (VbDcIdNo, VbCd, VbCtg, VbCrmTrig, VbTotVouchers, VbSingYN, VbMaxUse, VbOtpYN, VbValidFrm, VbValidTo, VbValidYN, ModUsr, ModDt, ModTime)
            VALUES 
            (@VbDcIdNo, @VbCd, @VbCtg, @VbCrmTrig, @VbTotVouchers, @VbSingYN, @VbMaxUse, @VbOtpYN, @VbValidFrm, @VbValidTo, @VbValidYN, @ModUsr, GETDATE(), 0)
        `,

        inputTypeMap: {
            VbDcIdNo: sql.BigInt,
            VbCd: sql.VarChar(50),
            VbCtg: sql.VarChar(20),
            VbCrmTrig: sql.VarChar(30),
            VbTotVouchers: sql.Int,
            VbSingYN: sql.VarChar(1),
            VbMaxUse: sql.Int,
            VbOtpYN: sql.VarChar(1),
            VbValidFrm: sql.SmallDateTime,
            VbValidTo: sql.SmallDateTime,
            VbValidYN: sql.VarChar(1),
            ModUsr: sql.VarChar(5)
        },

        prepareInputValues: (body, modUsr) => ({
            VbDcIdNo: body.VbDcIdNo,
            VbCd: body.VbCd,
            VbCtg: body.VbCtg,
            VbCrmTrig: body.VbCrmTrig || '',
            VbTotVouchers: body.VbTotVouchers || 0,
            VbSingYN: body.VbSingYN,
            VbMaxUse: parseInt(body.VbMaxUse),
            VbOtpYN: body.VbOtpYN,
            VbValidFrm: body.VbValidFrm,
            VbValidTo: body.VbValidTo,
            VbValidYN: body.VbValidYN,
            ModUsr: modUsr.substring(0, 5)
        })
    },

    updateData: {
        validate: (body) => {
            if (!body.VbIdNo) throw new Error('Batch ID (VbIdNo) is required');
            return true;
        },

        rawQuery: `
            UPDATE [${process.env.yDb}].[dbo].[voucherBatch]
            SET 
                VbDcIdNo = @VbDcIdNo,
                VbCd = @VbCd,
                VbCtg = @VbCtg,
                VbCrmTrig = @VbCrmTrig,
                VbTotVouchers = @VbTotVouchers,
                VbSingYN = @VbSingYN,
                VbMaxUse = @VbMaxUse,
                VbOtpYN = @VbOtpYN,
                VbValidFrm = @VbValidFrm,
                VbValidTo = @VbValidTo,
                VbValidYN = @VbValidYN,
                ModUsr = @ModUsr,
                ModDt = GETDATE(),
                ModTime = 0
            WHERE VbIdNo = @VbIdNo
        `,

        inputTypeMap: {
            VbIdNo: sql.BigInt,
            VbDcIdNo: sql.BigInt,
            VbCd: sql.VarChar(50),
            VbCtg: sql.VarChar(20),
            VbCrmTrig: sql.VarChar(30),
            VbTotVouchers: sql.Int,
            VbSingYN: sql.VarChar(1),
            VbMaxUse: sql.Int,
            VbOtpYN: sql.VarChar(1),
            VbValidFrm: sql.SmallDateTime,
            VbValidTo: sql.SmallDateTime,
            VbValidYN: sql.VarChar(1),
            ModUsr: sql.VarChar(5)
        },

        prepareInputValues: (body, modUsr) => ({
            VbIdNo: body.VbIdNo,
            VbDcIdNo: body.VbDcIdNo,
            VbCd: body.VbCd,
            VbCtg: body.VbCtg,
            VbCrmTrig: body.VbCrmTrig || '',
            VbTotVouchers: body.VbTotVouchers || 0,
            VbSingYN: body.VbSingYN,
            VbMaxUse: parseInt(body.VbMaxUse),
            VbOtpYN: body.VbOtpYN,
            VbValidFrm: body.VbValidFrm,
            VbValidTo: body.VbValidTo,
            VbValidYN: body.VbValidYN,
            ModUsr: modUsr.substring(0, 5)
        })
    },

    deleteData: {
        rawQuery: `DELETE FROM [${process.env.yDb}].[dbo].[voucherBatch] WHERE VbIdNo = @VbIdNo`,
        inputTypeMap: { VbIdNo: sql.BigInt },
        prepareInputValues: (body) => ({ VbIdNo: body.VbIdNo })
    }
};
