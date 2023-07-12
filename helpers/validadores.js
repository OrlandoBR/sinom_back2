const { dbConnection, sql } = require('../database/config.db')

const esUsuarioValido = async (usuario = 'NA')=>{
    console.log(`V - Valida Usuario ${usuario}`)

    if (usuario!='NA' && usuario !='' ){

        const query = `Select * from usuarios where usuario = '${usuario}'`
        const pool = await dbConnection()
        const existe = await pool.request()
                .query(query)         

        if (existe.rowsAffected[0]<1 ){
            console.log('- Falló validación')
            throw new Error(`El usuario de sistema ${usuario} no esta registrado.`)
        }
        console.log('- Validación exitosa')
    }
}

const esCurpValido = async (curp = 'NA')=>{
    console.log(`V - Validando CURP no exista en BD ${curp}`)

    if (curp!='NA' && curp !='' ){

        const query = `Select curp from maestro where curp = '${curp}'`
        const pool = await dbConnection()
        const existe = await pool.request()
                .query(query)         

        if (existe.rowsAffected[0]>0 ){
            console.log('- Falló validación')
            throw new Error(`El CURP ${curp} ya existe.`)
        }
        console.log('- Validación exitosa')
    }
}

const esId_trabajadorValido = async (id='NA')=>{
    console.log(`Valida Id_Trabajador que no exista en base de datos ${id}`)

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

const validaId_trabajadorExiste = async (id_trabajador='NA')=>{
    console.log('V - Valida que el Id_Trabajdor ya exista en Maestro')

    if (id_trabajador!='' && id_trabajador!='NA'){

        const query =`SELECT id_trabajador FROM Maestro where id_trabajador = '${id_trabajador}' `
        const pool = await dbConnection()
        const existe = await pool.request().query(query)
        
        if (existe.rowsAffected[0]==0 ){
            console.log('- Falló validación')
            throw new Error(`El maestro con id_trabajador ${id_trabajador} no existe.`)
        }
        console.log('- Validación exitosa')
    }
}

const validaRepeticionTipoNomina = async (valor,req)=>{
        console.log('V - Valida que el Id_Trabajdor y el tipo de nomina no exista activo')
        //console.log(valor)
        const { id_trabajador='' , id_tipo_nomina=''} = req.body

        //console.log(req.body)

        const query = `SELECT id_trabajador FROm Mtro_Nominas
                        where id_trabajador = '${id_trabajador}'
                            and id_tipo_nomina = '${id_tipo_nomina}'
                            and estatus = 1 `

        const pool = await dbConnection()
        const existe = await pool.request().query(query)
       
        
        if (existe.rowsAffected[0] > 0){
            console.log('- Falló validación')
            throw new Error(`Ya existe el maestro ${id_trabajador} con el tipo de nomina ${id_tipo_nomina} activo.`)
        }
        console.log('- Validación exitosa')
}

const validaFechasValidas = (valor,req)=>{
    console.log('V - Valida las fechas de nomina desde y hasta sean validas')

    const {qna_desde=0, qna_hasta=0} = req.body

    //if (qna_desde!=0 && qna_hasta!=0){
       
        if(qna_desde > qna_hasta){
            console.log('- Falló validación')
            throw new Error(`La qna hasta es menor que la qna desde.`)
        }

        console.log('- Validación exitosa')
    //}

}

module.exports = {
    esUsuarioValido,
    esCurpValido,
    esId_trabajadorValido,
    validaId_trabajadorExiste,
    validaRepeticionTipoNomina,
    validaFechasValidas
}