const sql = require('mssql');

module.exports = {
    label: 'Manage Customer Multiplier',
    
    getData: {
        selectClause: `
        yCmId,
        yCmCd,
        yCmName,
        yCmEmail,
        yCmCurCd,
        yCmDfltLng,
        yCmMulBy,
        yCmValidYN
      `,
        from:  `[${process.env.yDb}].dbo.yCustMst`,
        whereConditions: [],
        orderByClause: "yCmId",
        inputTypeMap: {},
        inputValuesMap: {}
    },
    updateData: {
        validate: (body) => {
            const { yCmId, yCmMulBy, yCmValidYN } = body;

            if (!yCmId) {
                throw new Error('Customer ID is required');
            }
            if (yCmMulBy === null || yCmMulBy === undefined || yCmMulBy === '') {
                throw new Error('Multiplier value is required');
            }
            if (!yCmValidYN || (yCmValidYN !== 'Y' && yCmValidYN !== 'N')) {
                throw new Error('Valid Y/N must be Y or N');
            }

            const mulValue = parseFloat(yCmMulBy);

            if (mulValue === 1) {
                throw new Error('Cannot set multiplier to 1. Multiplier must be greater than 1.');
            }
            if (mulValue <= 1) {
                throw new Error('Multiplier value must be greater than 1');
            }
            if (!/^\d+(\.\d{1,2})?$/.test(yCmMulBy)) {
                throw new Error('Multiplier can have up to 2 decimal places only');
            }

            return true;
        },
        rawQuery: `
        UPDATE [${process.env.yDb}].dbo.yCustMst 
        SET 
          yCmMulBy = @yCmMulBy,
          yCmValidYN = @yCmValidYN,
          yModUsr = @yModUsr,
          yModDt = GETDATE()
        WHERE yCmId = @yCmId
      `,
        inputTypeMap: {
            yCmId: sql.Int,
            yCmMulBy: sql.Decimal(10, 2),
            yCmValidYN: sql.VarChar(1),
            yModUsr: sql.VarChar(50)
        },
        prepareInputValues: (body, modUsr) => ({
            yCmId: parseInt(body.yCmId),
            yCmMulBy: parseFloat(parseFloat(body.yCmMulBy).toFixed(2)),
            yCmValidYN: body.yCmValidYN,
            yModUsr: modUsr
        }),
        successMessage: 'Customer updated successfully'
    }
};