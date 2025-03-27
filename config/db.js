const sql = require('mssql');

const config = {
    user: 'cuong142',
    password: 'cuong142.',
    server: 'localhost',
    database: 'library_db',
    options: {
        encrypt: false, // For Azure
        trustServerCertificate: true // For local dev / self-signed certs
    }
};

// Tạo pool kết nối
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL');
        return pool;
    })
    .catch(err => console.log('Database Connection Failed! Bad Config: ', err));

module.exports = {
    sql,
    config,
    poolPromise
}; 