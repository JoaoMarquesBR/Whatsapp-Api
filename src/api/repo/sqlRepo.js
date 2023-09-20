const sql = require('mssql');
const config = require('../../config/config');


async function insertData(sqlQuery, params) {
    try {
      await sql.connect(config.sqlConfig);
      const request = new sql.Request();
      console.log("connected to db")
      if (params) {
        for (const key in params) {
          if (params.hasOwnProperty(key)) {
            request.input(key, params[key]);
          }
        }
      }
      
      const result = await request.query(sqlQuery);
    } catch (err) {
      console.error('Error inserting data:', err);
    } finally {
      sql.close();
    }
  }
  

module.exports = {
    insertData,
};