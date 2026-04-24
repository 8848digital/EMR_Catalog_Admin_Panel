const sql = require('mssql');

module.exports = {
    label: 'Manage Vouchers',

    getData: {
        selectClause: `
            VchIdNo,
            VchVbIdNo,
            VchCd,
            VchCmCd,
            VchSts,
            VchUsedCnt,
            CONVERT(VARCHAR(10), VchIssDt, 120) AS VchIssDt,
            CONVERT(VARCHAR(10), VchRedDt, 120) AS VchRedDt,
            CONVERT(VARCHAR(10), VchExpDt, 120) AS VchExpDt
        `,
        from: `[${process.env.yDb}].[dbo].[voucher]`,
        whereConditions: [],
        orderByClause: "VchIdNo DESC",
        inputTypeMap: {},
        inputValuesMap: {}
    },

    addData: {
        validate: (body) => {
            const { VchVbIdNo, VchCd, VchSts, VchUsedCnt, VchIssDt } = body;
            if (!VchVbIdNo) throw new Error('Batch ID is required');
            if (!VchCd) throw new Error('Voucher Code is required');
            if (!VchSts) throw new Error('Status is required');
            if (VchUsedCnt === undefined) throw new Error('Used Count is required');
            if (!VchIssDt) throw new Error('Issue Date is required');
            return true;
        },

        rawQuery: `
            INSERT INTO [${process.env.yDb}].[dbo].[voucher]
            (VchVbIdNo, VchCd, VchCmCd, VchSts, VchUsedCnt, VchIssDt, VchRedDt, VchExpDt, ModUsr, ModDt, ModTime)
            VALUES 
            (@VchVbIdNo, @VchCd, @VchCmCd, @VchSts, @VchUsedCnt, @VchIssDt, @VchRedDt, @VchExpDt, @ModUsr, GETDATE(), 0)
        `,

        inputTypeMap: {
            VchVbIdNo: sql.BigInt,
            VchCd: sql.VarChar(50),
            VchCmCd: sql.VarChar(20),
            VchSts: sql.VarChar(15),
            VchUsedCnt: sql.Int,
            VchIssDt: sql.SmallDateTime,
            VchRedDt: sql.SmallDateTime,
            VchExpDt: sql.SmallDateTime,
            ModUsr: sql.VarChar(5)
        },

        prepareInputValues: (body) => ({
            VchVbIdNo: body.VchVbIdNo,
            VchCd: body.VchCd,
            VchCmCd: body.VchCmCd || '',
            VchSts: body.VchSts,
            VchUsedCnt: parseInt(body.VchUsedCnt),
            VchIssDt: body.VchIssDt,
            VchRedDt: body.VchRedDt || null,
            VchExpDt: body.VchExpDt || null,
            ModUsr: 'ADM'
        })
    },

    updateData: {
        validate: (body) => {
            if (!body.VchIdNo) throw new Error('Voucher ID is required');
            return true;
        },

        rawQuery: `
            UPDATE [${process.env.yDb}].[dbo].[voucher]
            SET 
                VchVbIdNo = @VchVbIdNo,
                VchCd = @VchCd,
                VchCmCd = @VchCmCd,
                VchSts = @VchSts,
                VchUsedCnt = @VchUsedCnt,
                VchIssDt = @VchIssDt,
                VchRedDt = @VchRedDt,
                VchExpDt = @VchExpDt,
                ModUsr = @ModUsr,
                ModDt = GETDATE(),
                ModTime = 0
            WHERE VchIdNo = @VchIdNo
        `,

        inputTypeMap: {
            VchIdNo: sql.BigInt,
            VchVbIdNo: sql.BigInt,
            VchCd: sql.VarChar(50),
            VchCmCd: sql.VarChar(20),
            VchSts: sql.VarChar(15),
            VchUsedCnt: sql.Int,
            VchIssDt: sql.SmallDateTime,
            VchRedDt: sql.SmallDateTime,
            VchExpDt: sql.SmallDateTime,
            ModUsr: sql.VarChar(5)
        },

        prepareInputValues: (body) => ({
            VchIdNo: body.VchIdNo,
            VchVbIdNo: body.VchVbIdNo,
            VchCd: body.VchCd,
            VchCmCd: body.VchCmCd || '',
            VchSts: body.VchSts,
            VchUsedCnt: parseInt(body.VchUsedCnt),
            VchIssDt: body.VchIssDt,
            VchRedDt: body.VchRedDt || null,
            VchExpDt: body.VchExpDt || null,
            ModUsr: 'ADM'
        })
    },

    deleteData: {
        rawQuery: `DELETE FROM [${process.env.yDb}].[dbo].[voucher] WHERE VchIdNo = @VchIdNo`,
        inputTypeMap: { VchIdNo: sql.BigInt },
        prepareInputValues: (body) => ({ VchIdNo: body.VchIdNo })
    }
};
