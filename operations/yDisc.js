const sql = require('mssql');

module.exports = {
    label: 'Manage Discounts',

    getData: {
        selectClause: `
            dcIdNo,
            dcPrmCd,
            dcRuleCd,
            dcTyp,
            dcValMode,
            dcVal,
            dcIngTgt,
            dcSlabBas,
            dcEchelon,
            dcExcYN,
            dcPriority,
            dcStkGrp,
            dcMaxCap,
            dcMinInvVal,
            dcValidYN,
            dcOccasion
        `,
        from: `[${process.env.yDb}].[dbo].[yDisc]`,
        whereConditions: [],
        orderByClause: "dcIdNo DESC",
        inputTypeMap: {},
        inputValuesMap: {}
    },

    addData: {
        validate: (body) => {
            const { dcPrmCd, dcRuleCd, dcTyp, dcValMode, dcEchelon, dcExcYN, dcPriority, dcValidYN } = body;
            if (!dcPrmCd) throw new Error('Promotion Code is required');
            if (!dcRuleCd) throw new Error('Rule Code is required');
            if (!dcTyp) throw new Error('Type is required');
            if (!dcValMode) throw new Error('Value Mode is required');
            if (!dcEchelon) throw new Error('Echelon is required');
            if (!dcExcYN) throw new Error('Exclusive Y/N is required');
            if (dcPriority === undefined) throw new Error('Priority is required');
            if (!dcValidYN) throw new Error('Valid Y/N status is required');
            return true;
        },

        rawQuery: `
            INSERT INTO [${process.env.yDb}].[dbo].[yDisc]
            (dcPrmCd, dcRuleCd, dcTyp, dcValMode, dcVal, dcIngTgt, dcSlabBas, dcEchelon, dcExcYN, dcPriority, dcStkGrp, dcMaxCap, dcMinInvVal, dcValidYN, dcOccasion, ModUsr, ModDt, ModTime)
            VALUES 
            (@dcPrmCd, @dcRuleCd, @dcTyp, @dcValMode, @dcVal, @dcIngTgt, @dcSlabBas, @dcEchelon, @dcExcYN, @dcPriority, @dcStkGrp, @dcMaxCap, @dcMinInvVal, @dcValidYN, @dcOccasion, @ModUsr, GETDATE(), 0)
        `,

        inputTypeMap: {
            dcPrmCd: sql.VarChar(30),
            dcRuleCd: sql.VarChar(30),
            dcTyp: sql.VarChar(30),
            dcValMode: sql.VarChar(10),
            dcVal: sql.Decimal(18, 2),
            dcIngTgt: sql.VarChar(20),
            dcSlabBas: sql.VarChar(20),
            dcEchelon: sql.VarChar(20),
            dcExcYN: sql.VarChar(1),
            dcPriority: sql.Int,
            dcStkGrp: sql.VarChar(30),
            dcMaxCap: sql.Decimal(18, 2),
            dcMinInvVal: sql.Decimal(18, 2),
            dcValidYN: sql.VarChar(1),
            dcOccasion: sql.VarChar(50),
            ModUsr: sql.VarChar(5)
        },

        prepareInputValues: (body) => ({
            dcPrmCd: body.dcPrmCd,
            dcRuleCd: body.dcRuleCd,
            dcTyp: body.dcTyp,
            dcValMode: body.dcValMode,
            dcVal: body.dcVal || 0,
            dcIngTgt: body.dcIngTgt || '',
            dcSlabBas: body.dcSlabBas || '',
            dcEchelon: body.dcEchelon,
            dcExcYN: body.dcExcYN,
            dcPriority: parseInt(body.dcPriority) || 0,
            dcStkGrp: body.dcStkGrp || '',
            dcMaxCap: body.dcMaxCap || 0,
            dcMinInvVal: body.dcMinInvVal || 0,
            dcValidYN: body.dcValidYN,
            dcOccasion: body.dcOccasion || null,
            ModUsr: 'ADM'
        })
    },

    updateData: {
        validate: (body) => {
            if (!body.dcIdNo) throw new Error('Discount ID is required');
            return true;
        },

        rawQuery: `
            UPDATE [${process.env.yDb}].[dbo].[yDisc]
            SET 
                dcPrmCd = @dcPrmCd,
                dcRuleCd = @dcRuleCd,
                dcTyp = @dcTyp,
                dcValMode = @dcValMode,
                dcVal = @dcVal,
                dcIngTgt = @dcIngTgt,
                dcSlabBas = @dcSlabBas,
                dcEchelon = @dcEchelon,
                dcExcYN = @dcExcYN,
                dcPriority = @dcPriority,
                dcStkGrp = @dcStkGrp,
                dcMaxCap = @dcMaxCap,
                dcMinInvVal = @dcMinInvVal,
                dcValidYN = @dcValidYN,
                dcOccasion = @dcOccasion,
                ModUsr = @ModUsr,
                ModDt = GETDATE(),
                ModTime = 0
            WHERE dcIdNo = @dcIdNo
        `,

        inputTypeMap: {
            dcIdNo: sql.BigInt,
            dcPrmCd: sql.VarChar(30),
            dcRuleCd: sql.VarChar(30),
            dcTyp: sql.VarChar(30),
            dcValMode: sql.VarChar(10),
            dcVal: sql.Decimal(18, 2),
            dcIngTgt: sql.VarChar(20),
            dcSlabBas: sql.VarChar(20),
            dcEchelon: sql.VarChar(20),
            dcExcYN: sql.VarChar(1),
            dcPriority: sql.Int,
            dcStkGrp: sql.VarChar(30),
            dcMaxCap: sql.Decimal(18, 2),
            dcMinInvVal: sql.Decimal(18, 2),
            dcValidYN: sql.VarChar(1),
            dcOccasion: sql.VarChar(50),
            ModUsr: sql.VarChar(5)
        },

        prepareInputValues: (body) => ({
            dcIdNo: body.dcIdNo,
            dcPrmCd: body.dcPrmCd,
            dcRuleCd: body.dcRuleCd,
            dcTyp: body.dcTyp,
            dcValMode: body.dcValMode,
            dcVal: body.dcVal || 0,
            dcIngTgt: body.dcIngTgt || '',
            dcSlabBas: body.dcSlabBas || '',
            dcEchelon: body.dcEchelon,
            dcExcYN: body.dcExcYN,
            dcPriority: parseInt(body.dcPriority) || 0,
            dcStkGrp: body.dcStkGrp || '',
            dcMaxCap: body.dcMaxCap || 0,
            dcMinInvVal: body.dcMinInvVal || 0,
            dcValidYN: body.dcValidYN,
            dcOccasion: body.dcOccasion || null,
            ModUsr: 'ADM'
        })
    },

    deleteData: {
        rawQuery: `DELETE FROM [${process.env.yDb}].[dbo].[yDisc] WHERE dcIdNo = @dcIdNo`,
        inputTypeMap: { dcIdNo: sql.BigInt },
        prepareInputValues: (body) => ({ dcIdNo: body.dcIdNo })
    }
};
