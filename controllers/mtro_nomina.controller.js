const { dbConnection, sql } = require('../database/config.db')

const mtroNominaGet = async (req,res)=>{

    const { id_trabajador='', nomina='',seccion='' , estatus='', curp='', MtroMasDeUnaNomina='' } = req.query

    if ( (id_trabajador == null || id_trabajador==='') && (nomina == null || nomina==='') 
        && (estatus == null || estatus==='') && (seccion==null||seccion==='')
        && (curp==null||curp==='') && (MtroMasDeUnaNomina==null||MtroMasDeUnaNomina==='') )
    {
        return res.status(400).json({ 
            msg:'Debe ingresar al menos un filtro de busqueda.'
        })
    } 

    console.log('Buscando Mtro-Nomina..')

    try{
        let sqll =`SELECT  
                    ROW_NUMBER() OVER(ORDER BY id_seccion, nom.id_tipo_nomina, curp, nom.estatus) as no,
                    id_nom_mtro,
                    nom.id_trabajador ,mtro.curp
                    ,(isnull(mtro.paterno,'')+' '+ isnull(mtro.materno,'')+' '+mtro.nombre) as nombre, 
                    id_seccion as seccion, nom.id_tipo_nomina, RTRIM(cat.nomina) as nomina ,qna_desde, qna_hasta
                    ,isnull(cargo,'') as 'cargo_mtro' 
                    ,nom.fecha_alta
                    ,isnull(nom.fecha_actualizacion,'') as fecha_actualizacion
                    , nom.estatus, isnull(nom.usuario,'') as usuario
                            
                FROM MTRO_NOMINAS nom
                    inner join CAT_TIPO_NOMINA cat on cat.id_tipo_nomina = nom.id_tipo_nomina
                    inner join MAESTRO mtro on mtro.id_trabajador = nom.id_trabajador
                WHERE
                    nom.id_trabajador like '%${id_trabajador}%'
                    and nom.id_tipo_nomina like '%${nomina}%'
                    and nom.estatus like '%${estatus}%'
                    and curp like '${curp}%'
            `
            if (seccion!=='')
                sqll+= ` and id_seccion = ${seccion}`
            
            if (MtroMasDeUnaNomina!=='')
                sqll+=` and nom.id_trabajador in (select id_trabajador from Mtro_Nominas group by id_trabajador having count(id_trabajador) >${MtroMasDeUnaNomina})`

            sqll+= ' ORDER BY id_seccion, nom.id_tipo_nomina, curp, nom.estatus'


    
    
    const pool = await dbConnection()
    const result = await pool.request().query(sqll)

    console.log(sqll)
    console.log('Mtro-Nomina Obtenida')
    res.status(200).json({
        msg: `${result.rowsAffected[0] > 0 ?'El maestro se consulto correctamente':'No existe el registro' }`,
        total:result.rowsAffected[0],
        datos:result.recordset,  
    })
    }
    catch(error){
        console.error('Error al consultar maestro:', error)
        res.status(500).json({
            msg:'Error al consultar el registro.-> ' + error.message
        })
    }finally{
        sql.close
    }
    
}

const mtroNominaPost = async(req,res)=>{

    const {
        id_trabajador,
        nomina,
        qna_desde,
        qna_hasta,
        usuario
        ,cargo=''
    } = req.body

    try{
        console.log('Validando datos para insercion...')

        const sqlvalida = `SELECT id_trabajador FROM MTRO_NOMINAS
                            WHERE
                                id_trabajador = '${id_trabajador}'
                                and id_tipo_nomina = ${nomina}
                                and estatus = 1
                            `
        console.log(sqlvalida)

        const pool = await dbConnection()
        const result2 = await pool.request().query(sqlvalida)

        if(result2.rowsAffected[0]>0){

            console.log('Validando fallida, ya existe el registro')
            res.status(400).json({
                msg:'El registro ya existe activo',
                datos: req.body
            })
            return
        }
        console.log('Intentando Insertar Mtro-Nomina...')

        const sqll = `INSERT INTO MTRO_NOMINAS
                        (
                            id_trabajador
                            ,id_tipo_nomina
                            ,qna_desde
                            ,qna_hasta
                            ,cargo
                            ,fecha_alta
                            ,estatus
                            ,usuario
                        )
                        VALUES (
                            '${id_trabajador}'
                            ,'${nomina}'
                            ,'${qna_desde}'
                            ,'${qna_hasta}'
                            ,'${cargo}'
                            , getdate()
                            , 1
                            ,'${usuario}'
                        ) `

            console.log('Insertando Mtro-Nomina')
            console.log(sqll)

           // pool = await dbConnection()
            const result = await pool.request().query(sqll)

            res.status(200).json({
                msg:'El registro se ha dado de alta exitosamente',
                datos: req.body
            })
       console.log('Proceso terminado :' + result)
    }
    catch(error){
        console.error('Error al insertar el registro:', error)
        res.status(500).json({
            msg:'Error al insertar el registro ',
            error
        })
    }
    finally{
        sql.close
    }
   
}

const mtroNominaPut = async(req,res)=>{
    const {
        id_trabajador,
        id_tipo_nomina,
        qna_desde,
        qna_hasta,
        usuario
        ,cargo=''
     } = req.body;
     
     const { id } = req.params
    
     try{
        const query = `UPDATE MTRO_NOMINAS SET
                            cargo = '${cargo}',
                            qna_hasta = '${qna_hasta}',
                            fecha_actualizacion = getdate(),
                            usuario = '${usuario}'
                        WHERE id_nom_mtro = '${id}'
                        `
        console.log('Actualizando Mtro-Nomina...')

        const pool = await dbConnection()
        const result = await pool.request().query(query)

        res.status(200).json({
            msg:'El registro se actualizo exitosamente',
            datos:req.body,
            id
        })
        console.log('Proceso terminado :')
     }catch(error){
        console.error('Error al actualizar el registro:', error)
        res.status(500).json({
            msg:'Error al actualizar el registro '
        })
     }finally{
        sql.close
     }

}

module.exports = {
    mtroNominaGet,
    mtroNominaPost,
    mtroNominaPut
}