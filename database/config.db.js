const sql = require('mssql')

const dbConnection = async()=>{

    const dbSettings = {
        user:process.env.USER,
        password:process.env.PASS,
        server:process.env.SERVER,
        database:process.env.DB,
        options:{
            trustServerCertificate: true
        }

    }

    sql.connect(dbSettings)
    .then(()=>{
        console.log(`Conexión a la base de datos ${dbSettings.database} establecida`);
        //return sql
    })
    .catch((err) => {
      console.log('Error al conectar a la base de datos:', err);
    });

}

module.exports = {
    dbConnection, sql
}