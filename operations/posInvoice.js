const sql = require('mssql');

module.exports = {
    label: 'Manage POS Invoice',

    getData: {
        selectClause: `
            yId,
            CONVERT(VARCHAR(10), [Date], 120) AS [Date],
            InvNo,
            ModeOfPayment,
            Amount,
            ModUsr
        `,

        from: `[${process.env.yDb}].[dbo].[yPosInvoice]`,
        whereConditions: [],
        orderByClause: "[Date] DESC",
        inputTypeMap: {},
        inputValuesMap: {}
    }
};
