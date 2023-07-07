const { dbConnection, sql } = require('../database/config.db')

const maestroGet = (req, res)=> {
    //Obtiene los parametros que vienen en la URL ?
    const query = req.query

    const body = req.body;
    res.json({
      msg:'get API - controlador',
      query,
      body
    })
}

const maestroPost = async(req, res)=> {
    
    const {
        curp,
        rfc='',
        paterno,
        materno,
        nombre,
        seccion,
        qna_ing_snte,
        telefono,
        correo,
        domicilio='',
        municipio='',
        usuario,
        id_trabajador
     } = req.body;

    try{

        const pool = await dbConnection()
        const result = await pool.request()
        .input('curp',sql.VarChar,curp)
        .input('rfc',sql.VarChar,rfc)
        .input('paterno',sql.VarChar,paterno)
        .input('materno',sql.VarChar,materno)
        .input('nombre',sql.VarChar,nombre)
        .input('telefono',sql.VarChar,telefono)
        .input('correo',sql.VarChar,correo)
        .input('seccion',sql.VarChar,seccion)
        .input('qna_ing_snte',sql.VarChar,qna_ing_snte)
        .input('domicilio',sql.VarChar,domicilio)
        .input('municipio',sql.VarChar,municipio)
        .input('id_trabajador',sql.VarChar,id_trabajador)
        .input('usuario',sql.VarChar,usuario)
        .query(`INSERT INTO MAESTRO 
                (  id_trabajador,
                   curp,
                   rfc,
                   paterno,
                   materno,
                   nombre,
                   telefono,
                   correo,
                   id_seccion,
                   qna_ing_snte,
                   domicilio,
                   municipio,
                   fecha_alta,
                   estatus,
                   usuario
                   ) VALUES ( 
                       @id_trabajador,
                       @curp,
                       @rfc,
                       @paterno,
                       @materno,
                       @nombre,
                       @telefono,
                       @correo,
                       @seccion,
                       @qna_ing_snte,
                       @domicilio,
                       @municipio,
                       getdate(),
                       1,
                       @usuario
                       ) `)
   
   
       res.status(200).json({
           msg:'El maestro se registro correctmaente',
           datos:req.body
       })

    }catch(error){
        console.error('Error al insertar maestro:',error)
        res.status(500).json({
            msg:'Error al insertar el registro '
        })
    }finally{
        sql.close()
    }
     
}

const maestroPut = (req, res)=> {

    const {id} = req.params
    res.json({
        msg:'put API - controlador',
        id
    })
}

module.exports = {
    maestroGet,
    maestroPost,
    maestroPut
}