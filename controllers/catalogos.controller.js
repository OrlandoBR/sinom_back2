const { dbConnection, sql } = require('../database/config.db')

const obtenTipoNomina = async(req, res)=>{

    const {
        id_Trabajador
    }= req.query
    console.log(req)
    let query = `	SELECT 
                        nom.id_tipo_nomina as id, nomina as descripcion
                    FROM [dbo].[Mtro_Nominas] mtro
                        inner join [dbo].[Cat_Tipo_Nomina] nom on mtro.id_tipo_nomina = nom.id_tipo_nomina
                    WHERE id_trabajador = '${id_Trabajador}'
                `  

    try{
        const pool = await dbConnection()
        const result = await pool.request().query(query)
        console.log(query)
        res.status(200).json({
            msg: `${result.rowsAffected[0] > 0 ?'Maestro se consulto correctamente':'No existe el registro' }`,
            total:result.rowsAffected[0],
            datos:result.recordset,  
        })

    }catch(error){
        console.error('Error al consultar: ', error)
        res.status(500).json({
            msg:'Error al consultar el registro.-> ' + error.message,
            error: error.originalError.info

        })
    }
    finally{
        sql.close
    }

}

module.exports = {
    obtenTipoNomina
}