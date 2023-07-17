const { dbConnection, sql } = require('../database/config.db')

const usuarioGet = async(req,res)=>{
    const { usuario='', clave='' } = req.body

    if ( (usuario == null || usuario==='') && (clave == null || clave===''))
    {
        return res.status(400).json({ 
            msg:'Debe ingresar usuario y clave'
        })
    } 

    console.log('Buscando Usuario..')

    try{
        let sqll =`SELECT  
                    nombre, usuario, clave, role, estatus
                FROM Usuarios
                WHERE
                    usuario = '${usuario}'
                    and clave = '${clave}' `
    //console.log(sql)
    
    const pool = await dbConnection()
    const result = await pool.request().query(sqll)
    console.log('Usuario Obtenido')
    res.status(200).json({
        msg: `${result.rowsAffected[0] > 0 ?'El usuario se consulto correctamente':'No existe el registro' }`,
        total:result.rowsAffected[0],
        datos:result.recordset,  
    })
    }
    catch(error){
        console.error('Error al consultar usuario:', error)
        res.status(500).json({
            msg:'Error al consultar el registro.-> ' + error.message
        })
    }finally{
        sql.close
    }
    
}

module.exports = {
    usuarioGet
}