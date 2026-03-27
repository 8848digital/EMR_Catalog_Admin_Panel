const sql = require('mssql');

module.exports = {
    label: 'Manage POS',

    getData: {
        selectClause: `
            yId,
            CONVERT(VARCHAR(10), [Date], 120) AS [Date],
            InvAmt,
            ModeOfPayment,
            OpeningAmount,
            ExpectedAmount,
            ClosingAmount,
            Difference,
            closingStatus,
            ModUsr
        `,

        from: `[${process.env.yDb}].[dbo].[ypos]`,
        whereConditions: [],
        orderByClause: "[Date] DESC",
        inputTypeMap: {},
        inputValuesMap: {}
    }
};
