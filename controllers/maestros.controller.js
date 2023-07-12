const { dbConnection, sql } = require('../database/config.db')

const maestroGet = async(req, res)=> {
    //Obtiene los parametros que vienen en la URL ?
    const { id_trabajador='', 
            curp='', 
            paterno='', 
            materno='', 
            nombre='', 
            seccion='',
            nomina='', 
            pag_ini='',
            no_registros='' } = req.query
    console.log('Consultando Maestro..')
    
    if ( (nombre == null || nombre==='') && (paterno == null || paterno==='') 
    && (materno == null || materno==='')  && (curp == null || curp==='') 
    && (seccion == null || seccion==='') && (nomina == null || nomina==='')
    && (id_trabajador == null || id_trabajador ==='') )
    {
        return res.status(400).json({ 
            msg:'Debe ingresar al menos un filtro de busqueda.'
        })
    }       

    try{

        var sql =`SELECT 
                     m.id_trabajador, curp, isnull(rfc,'') as rfc,
                     paterno, isnull(materno,'') as materno, nombre,
                     id_seccion, isnull(qna_ing_snte,'') as qna_ing_snte,
                     isnull(telefono,'') as telefono, isnull(correo,'') as correo,
                     isnull(domicilio,'') as domicilio, isnull(municipio,'') as municipio,
                     m.fecha_alta, isnull(m.fecha_actualizacion,'') as fecha_actualizcion, 
                     m.estatus, isnull(m.usuario,'') as usuario
                     , COUNT(n.id_trabajador) AS veces_en_nomina
                FROM MAESTRO m
                LEFT JOIN mtro_nominas n ON m.id_trabajador = n.id_trabajador
                WHERE
                    m.id_trabajador like '${id_trabajador}%' 
                    and curp like '${curp}%'
                    and paterno like '${paterno}%'
                    and materno like '${materno}%'
                    and nombre like  '%${nombre}%'
                `
            if (seccion!=='')
                sql+= `and id_seccion = ${seccion}`
            
            sql+= ` GROUP BY m.id_trabajador, curp, rfc, paterno
                    , materno, nombre, id_seccion, qna_ing_snte
                    , telefono, correo, domicilio, municipio
                    , m.fecha_alta, m.fecha_actualizacion, m.estatus, m.usuario `

            if (pag_ini !=='' && no_registros!==''){
                sql+= ` OFFSET ${pag_ini} ROWS FETCH NEXT ${no_registros} ROWS ONLY `
            }


        console.log(sql)
        const pool = await dbConnection()
        const result = await pool.request().query(sql)
        res.status(200).json({
            msg: `${result.rowsAffected[0] > 0 ?'El maestro se consulto correctamente':'No existe el registro' }`,
            total:result.rowsAffected[0],
            datos:result.recordset,  
        })
        console.log('Registros obtenidos Consultando Maestro..')

    }catch(error){
        console.error('Error al consultar maestro:', error)
        res.status(500).json({
            msg:'Error al consultar el registro.-> ' + error.message
        })
    }finally{
        sql.close
    }

}

const maestroGetId = async(req,res)=>{

    const { id='' } = req.params

    try{
       var sql =`SELECT 
                       m.id_trabajador, curp, isnull(rfc,'') as rfc,
                       paterno, isnull(materno,'') as materno, nombre,
                       id_seccion, isnull(qna_ing_snte,'') as qna_ing_snte,
                       isnull(telefono,'') as telefono, isnull(correo,'') as correo,
                       isnull(domicilio,'') as domicilio, isnull(municipio,'') as municipio,
                       m.fecha_alta, isnull(m.fecha_actualizacion,'') as fecha_actualizacion, 
                       m.estatus, isnull(usuario,'') as usuario 
                        , COUNT(n.id_trabajador) AS veces_en_nomina
                FROM maestro m
                LEFT JOIN mtro_nominas n ON m.id_trabajador = n.id_trabajador
                WHERE m.id_trabajador = '${id}'
                GROUP BY m.id_trabajador, curp, rfc, paterno
                        , materno, nombre, id_seccion, qna_ing_snte
                        , telefono, correo, domicilio, municipio
                        , m.fecha_alta, m.fecha_actualizacion, m.estatus, usuario `
    
        console.log(`Consultando maestro id: ${id}.. `)
        console.log(sql)

        const pool = await dbConnection()
        const result = await pool.request().query(sql)
        
        res.status(200).json({
            msg: `${result.rowsAffected[0] > 0 ?'El maestro se consulto correctamente':'No existe el registro' }`,
            total:result.rowsAffected[0],
            datos:result.recordset,  
        }) 
        console.log("Se consulto maestro")
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
   
       console.log("Maestro Creado")
       res.status(200).json({
           msg:'El registro se ha dado de alta exitosamente',
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

const maestroPut = async (req, res)=> {

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
        estatus = 1
     } = req.body;
     
     const { id } = req.params

    try{

        const sql = `UPDATE MAESTRO SET
                        curp    = '${curp}',
                        rfc     = '${rfc}',
                        paterno = '${paterno}',
                        materno = '${materno}',
                        nombre  = '${nombre}',
                        telefono= '${telefono}',
                        correo  = '${correo}',
                        id_seccion = '${seccion}',
                        qna_ing_snte = '${qna_ing_snte}',
                        domicilio = '${domicilio}',
                        municipio = '${municipio}',
                        usuario = '${usuario}',
                        estatus = ${estatus},
                        fecha_actualizacion = getdate()
                    Where id_trabajador = '${id}' `
        //console.log(sql)

        const pool = await dbConnection()
        const result = await pool.request()
        .query(sql)
       res.status(200).json({
           msg:'El registro se actualizo exitosamente',
           datos:req.body,
           id
       })
        console.log(`Maestro ${id} actualizado`)
    }catch(error){
        console.error('Error al actualizar maestro:', error)
        res.status(500).json({
            msg:'Error al actualizar el registro.-> ' + error.message
        })
    }finally{
        sql.close()
    }
}

const maestroGetId_Siguiente = async (req,res)=>{
    const {secc = ''} = req.params

    const sql = `select 
                    top 1 id_trabajador 
                 from MAESTRO 
                    where id_seccion = ${secc} 
                    and id_trabajador not in (select id_trabajador  
                                                from maestro where id_seccion = ${secc} 
                                                                    and id_trabajador like '%PA%') 
                order by id_trabajador desc`

    console.log(sql)
    console.log('Obteniendo Id (contador) del maestro')
    
    try{
        const pool = await dbConnection()
        const result = await pool.request().query(sql)

        let resultado = ''
        if (result.rowsAffected[0] > 0){
            let {id_trabajador} = result.recordset[0];
            let partes = id_trabajador.split("-"); // Divide la cadena en dos partes en el guion
            let parteIzquierda = partes[0];
            let parteDerecha = partes[1];

            let numero = parseInt(parteDerecha, 10); // Convierte la parte derecha en un número entero
            numero += 1; // Suma uno al número
            let parteDerechaActualizada = numero.toString().padStart(3, "0"); // Agrega ceros a la izquierda si es necesario
            resultado = parteIzquierda + "-" + parteDerechaActualizada; // Une la parte izquierda con el número incrementado
            console.log("Id_Trabajdor siguiente: "+resultado); 
        }

        res.status(200).json({
            msg: `${result.rowsAffected[0] > 0 ?'El maestro se consulto correctamente':'No existe el registro' }`,
            total:result.rowsAffected[0],
            datos:result.rowsAffected[0]>0 ? result.recordset[0].id_trabajador:result.recordset, 
            siguiente:resultado
        })
    }
    catch(error){
        console.error('Error al obtener id de maestro:', error)
        res.status(500).json({
            msg:'Error al consultar el registro.-> ' + error.message
        })
    }finally{
        sql.close
    }

}

module.exports = {
    maestroGet,
    maestroGetId,
    maestroPost,
    maestroPut,
    maestroGetId_Siguiente
}