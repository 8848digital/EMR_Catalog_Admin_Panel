const { exeQuery } = require('../utils/queryHandler');

async function getAdvEvents(conn) {
  const { sql } = conn;

  const result = await exeQuery(conn, {
    selectClause: `
      PMCd       AS title,
      PDesc225   AS description,
      PValue     AS startDate,
      PValue1    AS endDate,
      PNum       AS duration,
      PValue2    AS img1,
      PValue3    AS img2,
      PValue4    AS img3,
      PValue5    AS img4
    `,
    from: `[${process.env.yDb}].[dbo].[YAdCfg]`,
    whereConditions: ['PTyp = @PTyp'],
    inputTypeMap: {
      PTyp: sql.VarChar,
    },
    inputValuesMap: {
      PTyp: 'YAdvEvent',
    },
  });

  return result.map((e) => ({
    title: e.title,
    description: e.description,
    startDate: e.startDate,
    endDate: e.endDate,
    duration: e.duration,
    image: [e.img1, e.img2, e.img3, e.img4].filter((img) => img?.trim()),
  }));
}

module.exports = { getAdvEvents };
