const { exeQuery } = require('../utils/queryHandler');

async function getEmailData(conn) {
  try {
    const { sql } = conn;
    const dbName = process.env.yDb;
    const queryStmts = {
      selectClause: `
        PDesc,
        PDesc225,
        yPIdNo
      `,
      from: `[${dbName}].[dbo].[yParam]`,
      whereConditions: ["PTyp = @PTyp", "PMCd = @PMCd"],
      orderByClause: "PSCd, yPIdNo",
      inputTypeMap: {
        PTyp: sql.VarChar(50),
        PMCd: sql.VarChar(50)
      },
      inputValuesMap: {
        PTyp: 'yCfg',
        PMCd: 'MlCfg'
      }
    };

    const result = await exeQuery(conn, queryStmts);
    return result || [];
  } catch (error) {
    console.error("Error in getEmailData:", error);
    throw error;
  }
}

async function updateEmailData(conn) {
  try {
    const { sql, req } = conn;
    const dbName = process.env.yDb;
    const { yPIdNo, PDesc225 } = req.body;
    const modUsr = req.body.modUsr;

    if (!yPIdNo) {
      throw new Error('Email ID is required');
    }
    if (!PDesc225 || PDesc225.trim() === '') {
      throw new Error('Description 225 is required');
    }

    // Ensure yPIdNo is properly converted to integer
    const emailId = parseInt(yPIdNo, 10);
    if (isNaN(emailId)) {
      throw new Error('Invalid Email ID format');
    }

    const queryStmts = {
      rawQuery: `
        UPDATE [${dbName}].[dbo].[yParam]
        SET 
          PDesc225 = @PDesc225,
          ModUsr = @ModUsr,
          ModDt = GETDATE(),
          ModTime = @ModTime
        WHERE yPIdNo = @yPIdNo
      `,
      inputTypeMap: {
        yPIdNo: sql.Int,
        PDesc225: sql.VarChar(225),
        ModUsr: sql.VarChar(5),
        ModTime: sql.Numeric(5, 2)
      },
      inputValuesMap: {
        yPIdNo: emailId,
        PDesc225: PDesc225.trim(),
        ModUsr: (modUsr ).substring(0, 10), 
        ModTime: 0.00
      },
      returnRaw: true
    };

    const result = await exeQuery(conn, queryStmts);

    if (result.rowsAffected[0] === 0) {
      throw new Error('Email configuration not found or no changes made');
    }

    return { message: 'Email configuration updated successfully', yPIdNo: emailId };
  } catch (error) {
    console.error("Error in updateEmailData:", error);
    throw error;
  }
}

async function addEmailData(conn) {
  try {
    const { sql, req } = conn;
    const dbName = process.env.yDb;
    const { PDesc, PDesc225 } = req.body;
    const modUsr = req.body.modUsr;

    if (!PDesc || (PDesc !== 'to' && PDesc !== 'cc')) {
      throw new Error('Mail must be either "to" or "cc"');
    }
    if (!PDesc225 || PDesc225.trim() === '') {
      throw new Error('Email id is required');
    }

    const getMaxPSCdQuery = {
      rawQuery: `
        SELECT ISNULL(MAX(CAST(PSCd AS INT)), 0) + 1 AS NextPSCd
        FROM [${dbName}].[dbo].[yParam]
        WHERE PTyp = 'yCfg' 
          AND PMCd = 'MlCfg'
          AND PDesc = @PDesc
      `,
      inputTypeMap: {
        PDesc: sql.VarChar(50)
      },
      inputValuesMap: {
        PDesc: PDesc
      }
    };

    const maxResult = await exeQuery(conn, getMaxPSCdQuery);
    const nextPSCd = maxResult[0]?.NextPSCd || 1;

    // Insert new record
    const insertQuery = {
      rawQuery: `
        INSERT INTO [${dbName}].[dbo].[yParam]
        (PTyp, PMCd, PSCd, PDesc, PDesc225, PValue, PNum, PValue1, PNum1, PValue2, 
         ModUsr, ModDt, ModTime, PValue3, PValidYn, PPrtKey)
        VALUES 
        (@PTyp, @PMCd, @PSCd, @PDesc, @PDesc225, @PValue, @PNum, @PValue1, @PNum1, @PValue2,
         @ModUsr, GETDATE(), @ModTime, @PValue3, @PValidYn, @PPrtKey)
      `,
      inputTypeMap: {
        PTyp: sql.VarChar(20),
        PMCd: sql.VarChar(30),
        PSCd: sql.VarChar(30),
        PDesc: sql.VarChar(30),
        PDesc225: sql.VarChar(225),
        PValue: sql.VarChar(30),
        PNum: sql.Float,
        PValue1: sql.VarChar(120),
        PNum1: sql.Float,
        PValue2: sql.VarChar(90),
        ModUsr: sql.VarChar(5),
        ModTime: sql.Numeric(5, 2),
        PValue3: sql.VarChar(30),
        PValidYn: sql.VarChar(1),
        PPrtKey: sql.VarChar(1)
      },
      inputValuesMap: {
        PTyp: 'yCfg',
        PMCd: 'MlCfg',
        PSCd: nextPSCd.toString(),
        PDesc: PDesc,
        PDesc225: PDesc225.trim(),
        PValue: '',
        PNum: 0,
        PValue1: '',
        PNum1: 0,
        PValue2: '',
        ModUsr: (modUsr).substring(0, 10), 
        ModTime: 0.00,
        PValue3: '1',
        PValidYn: '',
        PPrtKey: 'C'
      },
      returnRaw: true
    };

    const result = await exeQuery(conn, insertQuery);

    if (result.rowsAffected[0] === 0) {
      throw new Error('Failed to add email configuration');
    }

    return { message: 'Email configuration added successfully', PSCd: nextPSCd };
  } catch (error) {
    console.error("Error in addEmailData:", error);
    throw error;
  }
}

module.exports = {
  getEmailData,
  updateEmailData,
  addEmailData
};