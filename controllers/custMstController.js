const { exeQuery } = require('../utils/queryHandler');

async function getCustMstData(conn) {
  try {
    const { sql } = conn;
    const dbName = process.env.yDb;
    const queryStmts = {
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
      from: `[${dbName}].dbo.yCustMst`,
      whereConditions: [],
      orderByClause: "yCmId",
      inputTypeMap: {},
      inputValuesMap: {},
    };

    const result = await exeQuery(conn, queryStmts);
    return result || [];
  } catch (error) {
    console.error("Error in getCustMstData:", error);
    throw error;
  }
}

// Modified: Update Multiplier and ValidYN
async function updateCustMstData(conn) {
  try {
    const { sql, req } = conn;
    const dbName = process.env.yDb;
    const { yCmId, yCmMulBy, yCmValidYN } = req.body;

    const modUsr = req.body.modUsr;

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

    // Check if trying to set multiplier to exactly 1
    if (mulValue === 1) {
      throw new Error('Cannot set multiplier to 1. Multiplier must be greater than 1.');
    }

    // must be > 1 (not >= 1)
    if (mulValue <= 1) {
      throw new Error('Multiplier value must be greater than 1');
    }
    
    // must have at most 2 decimal places
    if (!/^\d+(\.\d{1,2})?$/.test(yCmMulBy)) {
      throw new Error('Multiplier can have up to 2 decimal places only');
    }

    // Update query: Set yCmMulBy and yCmValidYN
    const queryStmts = {
      rawQuery: `
        UPDATE [${dbName}].dbo.yCustMst 
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
      inputValuesMap: {
        yCmId: parseInt(yCmId),
        yCmMulBy: parseFloat(mulValue.toFixed(2)),
        yCmValidYN: yCmValidYN,
        yModUsr: modUsr
      },
      returnRaw: true
    };

    const result = await exeQuery(conn, queryStmts);

    if (result.rowsAffected[0] === 0) {
      throw new Error('Customer not found or no changes made');
    }

    return { message: 'Customer updated successfully', yCmId };
  } catch (error) {
    console.error("Error in updateCustMstData:", error);
    throw error;
  }
}

module.exports = {
  getCustMstData,
  updateCustMstData,
};