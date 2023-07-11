const { dbConnection, sql } = require('../database/config.db')

const esUsuarioValido = async (usuario = 'NA')=>{
    console.log(`Valida Usuario ${usuario}`)

    if (usuario!='NA' && usuario !='' ){

        const query = `Select * from usuarios where usuario = '${usuario}'`
        const pool = await dbConnection()
        const existe = await pool.request()
                .query(query)         

        if (existe.rowsAffected[0]<1 ){
            throw new Error(`El usuario de sistema ${usuario} no esta registrado.`)
        }
    }
}

const esCurpValido = async (curp = 'NA')=>{
    console.log(`Validandooo CURP ${curp}`)

    if (curp!='NA' && curp !='' ){

        const query = `Select curp from maestro where curp = '${curp}'`
        const pool = await dbConnection()
        const existe = await pool.request()
                .query(query)         

        if (existe.rowsAffected[0]>0 ){
            throw new Error(`El CURP ${curp} ya existe.`)
        }
    }
}

const esId_trabajadorValido = async (id='NA')=>{
    console.log(`Valida Id_Trabajador ${id}`)

    if (id!='NA' && id !='' ){

        const query = `Select * from Maestro where id_trabajador = '${id}'`
        const pool = await dbConnection()
        const existe = await pool.request()
                .query(query)         

        if (existe.rowsAffected[0]>0 ){
            throw new Error(`El maestro con id_trabajador ${id} ya existe.`)
        }
    }
}

module.exports = {
    esUsuarioValido,
    esCurpValido,
    esId_trabajadorValido
}