const { exeQuery } = require('../utils/queryHandler');
const operationRegistry = require('../utils/operationRegistry');

function getOperations(conn) {
  try {
    return operationRegistry.getAllOperations();
  } catch (error) {
    console.error("Error in getOperations:", error);
    throw error;
  }
}

async function getPMCdList(conn) {
  try {
    const { req } = conn;
    const { operation } = req.query;

    if (!operation) {
      throw new Error('Operation parameter is required');
    }

    const config = operationRegistry.getOperation(operation);

    if (!config.getPMCdList) {
      throw new Error(`Operation does not support PMCd list: ${operation}`);
    }

    const pmcdConfig = config.getPMCdList;

    const queryStmts = {
      selectClause: pmcdConfig.selectClause,
      from: typeof pmcdConfig.from === 'function'
        ? pmcdConfig.from()
        : pmcdConfig.from,
      whereConditions: pmcdConfig.whereConditions || [],
      orderByClause: pmcdConfig.orderByClause || '',
      inputTypeMap: pmcdConfig.inputTypeMap || {},
      inputValuesMap: pmcdConfig.inputValuesMap || {}
    };

    const result = await exeQuery(conn, queryStmts);
    return result || [];
  } catch (error) {
    console.error("Error in getPMCdList:", error);
    throw error;
  }
}

async function getPSCdList(conn) {
  try {
    const { req } = conn;
    const { operation } = req.query;

    if (!operation) {
      throw new Error('Operation parameter is required');
    }

    const config = operationRegistry.getOperation(operation);

    if (!config.getPSCdList) {
      throw new Error(`Operation does not support Customer list: ${operation}`);
    }

    const customerConfig = config.getPSCdList;

    const queryStmts = {
      selectClause: customerConfig.selectClause,
      from: typeof customerConfig.from === 'function'
        ? customerConfig.from()
        : customerConfig.from,
      whereConditions: customerConfig.whereConditions || [],
      orderByClause: customerConfig.orderByClause || '',
      inputTypeMap: customerConfig.inputTypeMap || {},
      inputValuesMap: customerConfig.inputValuesMap || {}
    };

    const result = await exeQuery(conn, queryStmts);
    return result || [];
  } catch (error) {
    console.error("Error in getPSCdList:", error);
    throw error;
  }
}

async function getNewCategoryList(conn) {
  try {
    const { req } = conn;
    const { operation } = req.query;

    if (!operation) {
      throw new Error('Operation parameter is required');
    }

    const config = operationRegistry.getOperation(operation);

    if (!config.getNewCategoryList) {
      throw new Error(`Operation does not support new category list: ${operation}`);
    }

    const categoryConfig = config.getNewCategoryList;

    const queryStmts = {
      selectClause: categoryConfig.selectClause,
      from: typeof categoryConfig.from === 'function'
        ? categoryConfig.from()
        : categoryConfig.from,
      whereConditions: categoryConfig.whereConditions || [],
      orderByClause: categoryConfig.orderByClause || '',
      inputTypeMap: categoryConfig.inputTypeMap || {},
      inputValuesMap: categoryConfig.inputValuesMap || {}
    };

    const result = await exeQuery(conn, queryStmts);
    return result || [];
  } catch (error) {
    console.error("Error in getNewCategoryList:", error);
    throw error;
  }
}

async function getData(conn) {
  try {
    const { req } = conn;
    const { operation, PMCd } = req.query;

    if (!operation) {
      throw new Error('Operation parameter is required');
    }

    const config = operationRegistry.getOperation(operation);

    if (!config.getData) {
      throw new Error(`Operation does not support getData: ${operation}`);
    }

    const getDataConfig = config.getData;

    const inputValuesMap = { ...getDataConfig.inputValuesMap };

    const requiresPMCd = getDataConfig.whereConditions &&
      getDataConfig.whereConditions.some(cond =>
        cond.includes('PMCd = @PMCd') || cond.includes('PMCd=@PMCd')
      ) &&
      !inputValuesMap.PMCd;

    if (requiresPMCd) {
      if (PMCd && PMCd.trim() !== '') {
        inputValuesMap.PMCd = PMCd;
      } else {
        throw new Error('PMCd is required for this operation');
      }
    }

    const queryStmts = {
      selectClause: getDataConfig.selectClause,
      from: typeof getDataConfig.from === 'function'
        ? getDataConfig.from()
        : getDataConfig.from,
      whereConditions: getDataConfig.whereConditions || [],
      orderByClause: getDataConfig.orderByClause || '',
      inputTypeMap: getDataConfig.inputTypeMap || {},
      inputValuesMap: inputValuesMap
    };

    const result = await exeQuery(conn, queryStmts);
    return result || [];
  } catch (error) {
    console.error("Error in getData:", error);
    throw error;
  }
}

async function updateData(conn) {
  try {
    const { req } = conn;
    const { operation } = req.body;

    if (!operation) {
      throw new Error('Operation parameter is required');
    }

    const config = operationRegistry.getOperation(operation);

    if (!config.updateData) {
      throw new Error(`Operation does not support update: ${operation}`);
    }

    const updateConfig = config.updateData;
    const modUsr = req.body.modUsr || '';

    if (updateConfig.validate) {
      updateConfig.validate(req.body);
    }

    if (updateConfig.customUpdate) {
      return await updateConfig.customUpdate(
        { ...conn, exeQuery },
        req.body,
        modUsr
      );
    }

    const queryStmts = {
      rawQuery: typeof updateConfig.rawQuery === 'function'
        ? updateConfig.rawQuery()
        : updateConfig.rawQuery,
      inputTypeMap: updateConfig.inputTypeMap,
      inputValuesMap: updateConfig.prepareInputValues(req.body, modUsr),
      returnRaw: true
    };

    const result = await exeQuery(conn, queryStmts);

    if (result.rowsAffected[0] === 0) {
      throw new Error('Record not found or no changes made');
    }

    return {
      message: updateConfig.successMessage || 'Record updated successfully'
    };
  } catch (error) {
    console.error("Error in updateData:", error);
    throw error;
  }
}

async function addData(conn) {
  try {
    const { req } = conn;
    const { operation } = req.body;

    if (!operation) {
      throw new Error('Operation parameter is required');
    }

    const config = operationRegistry.getOperation(operation);

    if (!config.addData) {
      throw new Error(`Operation does not support add: ${operation}`);
    }

    const addConfig = config.addData;
    const modUsr = req.body.modUsr || '';

    if (addConfig.validate) {
      addConfig.validate(req.body);
    }

    if (addConfig.customAdd) {
      return await addConfig.customAdd(
        { ...conn, exeQuery },
        req.body,
        modUsr
      );
    }

    const queryStmts = {
      rawQuery: typeof addConfig.rawQuery === 'function'
        ? addConfig.rawQuery()
        : addConfig.rawQuery,
      inputTypeMap: addConfig.inputTypeMap,
      inputValuesMap: addConfig.prepareInputValues(req.body, modUsr),
      returnRaw: true
    };

    const result = await exeQuery(conn, queryStmts);

    if (result.rowsAffected[0] === 0) {
      throw new Error('Failed to add record');
    }

    return {
      message: addConfig.successMessage || 'Record added successfully'
    };
  } catch (error) {
    console.error("Error in addData:", error);
    throw error;
  }
}

async function deleteData(conn) {
  try {
    const { req } = conn;
    const { operation } = req.body;

    if (!operation) {
      throw new Error('Operation parameter is required');
    }

    const config = operationRegistry.getOperation(operation);

    if (!config.deleteData) {
      throw new Error(`Operation does not support delete: ${operation}`);
    }

    const deleteConfig = config.deleteData;
    const modUsr = req.body.modUsr || '';

    if (deleteConfig.customDelete) {
      return await deleteConfig.customDelete(
        { ...conn, exeQuery },
        req.body,
        modUsr
      );
    }

    const queryStmts = {
      rawQuery: typeof deleteConfig.rawQuery === 'function'
        ? deleteConfig.rawQuery()
        : deleteConfig.rawQuery,
      inputTypeMap: deleteConfig.inputTypeMap,
      inputValuesMap: deleteConfig.prepareInputValues(req.body, modUsr),
      returnRaw: true
    };

    const result = await exeQuery(conn, queryStmts);

    if (result.rowsAffected[0] === 0) {
      throw new Error('Record not found');
    }

    return {
      message: deleteConfig.successMessage || 'Record deleted successfully'
    };
  } catch (error) {
    console.error("Error in deleteData:", error);
    throw error;
  }
}

async function bulkSaveData(conn) {
  try {
    const { req } = conn;
    const { operation, records } = req.body;

    if (!operation) {
      throw new Error('Operation parameter is required');
    }

    if (!records || !Array.isArray(records)) {
      throw new Error('Records array is required');
    }

    const config = operationRegistry.getOperation(operation);

    if (!config.bulkSave) {
      throw new Error(`Operation does not support bulk save: ${operation}`);
    }

    const bulkSaveConfig = config.bulkSave;
    const modUsr = req.body.modUsr || '';

    return await bulkSaveConfig.customBulkSave(
      { ...conn, exeQuery },
      records,
      req.body.PMCd,
      modUsr
    );
  } catch (error) {
    console.error("Error in bulkSaveData:", error);
    throw error;
  }
}

async function validateSize(conn) {
  try {
    const { req, sql } = conn;
    const { PSCd } = req.query;

    if (!PSCd) {
      throw new Error('PSCd parameter is required');
    }

    const queryStmts = {
      rawQuery: `
        SELECT COUNT(*) as count
        FROM [${process.env.DB_DATABASE}].dbo.Param
        WHERE PMCd = @SizeValue AND PTyp = 'DMSZ'
      `,
      inputTypeMap: {
        SizeValue: sql.VarChar(20)
      },
      inputValuesMap: {
        SizeValue: PSCd
      }
    };

    const result = await exeQuery(conn, queryStmts);
    const exists = result && result.length > 0 && result[0].count > 0;

    return {
      exists: exists,
      message: exists
        ? `Size "${PSCd}" is valid`
        : `Size "${PSCd}" does not exist in master sizes`
    };
  } catch (error) {
    console.error("Error in validateSize:", error);
    throw error;
  }
}

async function getLookupData(conn) {
  try {
    const { req, sql } = conn;
    const { source } = req.query;

    if (!source) {
      throw new Error('source parameter is required');
    }

    const yDb = process.env.yDb;

    // Lookup configurations
    const lookupConfigs = {
      yPromo: {
        selectClause: `PMCd AS value, PMCd + ' - ' + PDesc AS label`,
        from: `[${yDb}].[dbo].[yParam]`,
        whereConditions: ["PTyp = 'yPromo'", "PValidYn = 'Y'"],
        orderByClause: 'PMCd'
      },
      yEchelon: {
        selectClause: `PMCd AS value, PMCd + ' - ' + PDesc AS label`,
        from: `[${yDb}].[dbo].[yParam]`,
        whereConditions: ["PTyp = 'yEchelon'"],
        orderByClause: 'PNum'
      },
      ySlabBas: {
        selectClause: `PMCd AS value, PMCd + ' - ' + PDesc AS label`,
        from: `[${yDb}].[dbo].[yParam]`,
        whereConditions: ["PTyp = 'ySlabBas'"],
        orderByClause: 'PMCd'
      },
      yIngTrgt: {
        selectClause: `PMCd AS value, PMCd + ' - ' + PDesc AS label`,
        from: `[${yDb}].[dbo].[yParam]`,
        whereConditions: ["PTyp = 'yIngTrgt'"],
        orderByClause: 'PMCd'
      },
      yStckGrp: {
        selectClause: `PMCd AS value, PMCd + ' - ' + PDesc AS label`,
        from: `[${yDb}].[dbo].[yParam]`,
        whereConditions: ["PTyp = 'yStckGrp'"],
        orderByClause: 'PMCd'
      },
      yValMode: {
        selectClause: `PMCd AS value, PMCd + ' - ' + PDesc AS label`,
        from: `[${yDb}].[dbo].[yParam]`,
        whereConditions: ["PTyp = 'yValMode'"],
        orderByClause: 'PMCd'
      },
      yDiscTyp: {
        selectClause: `PMCd AS value, PMCd + ' - ' + PDesc AS label`,
        from: `[${yDb}].[dbo].[yParam]`,
        whereConditions: ["PTyp = 'yDiscTyp'"],
        orderByClause: 'PMCd'
      },
      yDisc: {
        selectClause: `CAST(dcIdNo AS VARCHAR(20)) AS value, dcRuleCd + ' (' + dcPrmCd + ')' AS label`,
        from: `[${yDb}].[dbo].[yDisc]`,
        whereConditions: ["dcValidYN = 'Y'"],
        orderByClause: 'dcIdNo DESC'
      },
      voucherBatch: {
        selectClause: `CAST(VbIdNo AS VARCHAR(20)) AS value, VbCd + ' (ID:' + CAST(VbIdNo AS VARCHAR(10)) + ')' AS label`,
        from: `[${yDb}].[dbo].[voucherBatch]`,
        whereConditions: ["VbValidYN = 'Y'"],
        orderByClause: 'VbIdNo DESC'
      }
    };

    const config = lookupConfigs[source];
    if (!config) {
      throw new Error(`Unknown lookup source: ${source}`);
    }

    const queryStmts = {
      selectClause: config.selectClause,
      from: config.from,
      whereConditions: config.whereConditions || [],
      orderByClause: config.orderByClause || '',
      inputTypeMap: {},
      inputValuesMap: {}
    };

    const result = await exeQuery(conn, queryStmts);
    return result || [];
  } catch (error) {
    console.error("Error in getLookupData:", error);
    throw error;
  }
}

module.exports = {
  getData,
  updateData,
  addData,
  deleteData,
  bulkSaveData,
  getOperations,
  getPMCdList,
  getPSCdList,
  getNewCategoryList,
  validateSize,
  getLookupData
};