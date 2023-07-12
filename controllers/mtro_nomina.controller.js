const { dbConnection, sql } = require('../database/config.db')

const mtroNominaGet = async (req,res)=>{

    const { id_trabajador='', id_tipo_nomina='',id_seccion='' , estatus='', curp='', MtroMasDeUnaNomina='' } = req.query

    if ( (id_trabajador == null || id_trabajador==='') && (id_tipo_nomina == null || id_tipo_nomina==='') 
        && (estatus == null || estatus==='') && (id_seccion==null||id_seccion==='')
        && (curp==null||curp==='') && (MtroMasDeUnaNomina==null||MtroMasDeUnaNomina==='') )
    {
        return res.status(400).json({ 
            msg:'Debe ingresar al menos un filtro de busqueda.'
        })
    } 

    console.log('Buscando Mtro-Nomina..')

    try{
        let sqll =`SELECT  
                    nom.id_trabajador ,mtro.curp
                    ,(isnull(mtro.paterno,'')+' '+ isnull(mtro.materno,'')+' '+mtro.nombre) as nombre, 
                    id_seccion as seccion, nom.id_tipo_nomina, cat.nomina ,qna_desde, qna_hasta
                    , isnull(cargo,'') as cargo ,nom.fecha_alta, isnull(nom.fecha_actualizacion,'') as fecha_actualizacion
                    , nom.estatus, isnull(nom.usuario,'') as usuario
                            
                FROM MTRO_NOMINAS nom
                    inner join CAT_TIPO_NOMINA cat on cat.id_tipo_nomina = nom.id_tipo_nomina
                    inner join MAESTRO mtro on mtro.id_trabajador = nom.id_trabajador
                WHERE
                    nom.id_trabajador like '%${id_trabajador}%'
                    and nom.id_tipo_nomina like '%${id_tipo_nomina}%'
                    and nom.estatus like '%${estatus}%'
                    and curp like '${curp}%'
            `
            if (id_seccion!=='')
                sqll+= ` and id_seccion = ${id_seccion}`
            
            if (MtroMasDeUnaNomina!=='')
                sqll+=` and nom.id_trabajador in (select id_trabajador from Mtro_Nominas group by id_trabajador having count(id_trabajador) >${MtroMasDeUnaNomina})`

            sqll+= ' ORDER BY nombre, nom.id_tipo_nomina'


    //console.log(sql)
    
    const pool = await dbConnection()
    const result = await pool.request().query(sqll)
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
        id_tipo_nomina,
        qna_desde,
        qna_hasta,
        usuario
        ,cargo=''
    } = req.body

    try{
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
                            ,'${id_tipo_nomina}'
                            ,'${qna_desde}'
                            ,'${qna_hasta}'
                            ,'${cargo}'
                            , getdate()
                            , 1
                            ,'${usuario}'
                        ) `

            console.log('Insertando Mtro-Nomina')
            console.log(sqll)

            const pool = await dbConnection()
            const result = await pool.request().query(sqll)

            res.status(200).json({
                mesg:'El registro se ha dado de alta exitosamente',
                datos: req.body
            })
       console.log('Proceso terminado :' + result)
    }
    catch(error){
        console.error('Error al insertar el registro:', error)
        res.status(500).json({
            msg:'Error al insertar el registro '
        })
    }
    finally{
        sql.close
    }
   
}

module.exports = {
    mtroNominaGet,
    mtroNominaPost
}