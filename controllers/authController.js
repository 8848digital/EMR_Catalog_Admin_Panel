const { exeQuery } = require('../utils/queryHandler');

async function loginUser(conn) {
  const { username, password } = conn.req.body;

  if (!username || !password) {
    conn.res.status(400).json({
      success: false,
      error: 'Username and password are required'
    });
    return;
  }

  const dbName = process.env.yDb;

  const queryStmts = {
    selectClause: `
      PMCd,
      PSCd
    `,
    from: `[${dbName}].[dbo].[yParam]`,
    whereConditions: [
      'PMCd = @username',
      'PSCd = @password',
      "PTyp = 'yAdmin'"
    ],
    inputValuesMap: {
      username: username,
      password: password
    }
  };

  const result = await exeQuery(conn, queryStmts);

  if (result && result.length > 0) {
    const user = result[0];

    conn.res.json({
      success: true,
      msg: 'Login successful',
      data: {
        username: user.PMCd,
        desc: user.PDesc
      }
    });
  } else {
    conn.res.status(401).json({
      success: false,
      error: 'Invalid username or password'
    });
  }
}

module.exports = {
  loginUser
};