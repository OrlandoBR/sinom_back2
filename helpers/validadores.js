const { dbConnection, sql } = require('../database/config.db')

const esUsuarioValido = async (usuario = '')=>{
    console.log(`Valida Usuario ${usuario}`)

    const query = `Select * from usuarios where usuario = '${usuario}'`
    const pool = await dbConnection()
    const existe = await pool.request()
            .query(query)         

    if (existe.rowsAffected[0]<1 ){
        throw new Error(`El usuario ${usuario} no esta registrado.`)
    }
}

module.exports = {
    esUsuarioValido
}