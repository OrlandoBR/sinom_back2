const { dbConnection, sql } = require('../database/config.db')
//TODAS son peticions GET pues las tablas de la BD se llenan por medio de un store que se ejecuta cuando se quiere calcular la nomina.

//Se obtiene los registros de cuando y que se ordeno pagar al maestro, tipo de nomina y el tipo de pago.
const obtenNomApagar = async(req,res)=>{

    const {
        id_trabajador='', 
        curp='',
        paterno='',
        materno='',
        nombre='',
        nomina='',
        id_tipo_pago='', 
        qna_pago='',
        seccion='',
        id_nom_apagar='' } = req.query

    if (id_trabajador==='' && curp==='' && id_tipo_pago==='' 
        && qna_pago==='' && paterno==='' && materno ==='' 
        && nombre ==='' && nomina === '' && seccion === ''
        && id_nom_apagar === ''){

        return res.status(400).json({ 
            msg:'Debe ingresar al menos un filtro de busqueda.'
        })
    }

    try{
        let query = `SELECT
                            ROW_NUMBER() OVER(ORDER BY qna_pago DESC, nomina, id_seccion, curp, consecutivo) as no,
                            id_nom_apagar
                            ,mtro.id_trabajador
                            ,curp
                            ,(paterno +' '+ isnull(materno,'')+' '+ nombre) as nombre
                            ,id_seccion as seccion
                            ,qna_pago
                            ,consecutivo as pago
                            ,RTRIM(nomina) as nomina
                            ,tipo_pago
                        FROM Nominas_APagar apagar
                            inner join Mtro_Nominas mnom on mnom.id_nom_mtro = apagar.id_nom_mtro
                            inner join Maestro mtro on mtro.id_trabajador = mnom.id_trabajador
                            inner join Cat_Tipo_Nomina tnom on tnom.id_tipo_nomina = mnom.id_tipo_nomina
                            inner join Cat_Tipo_Pago tpago on tpago.id_tipo_pago = apagar.id_tipo_pago
                        WHERE
                            mtro.id_trabajador like '%${id_trabajador}%'
                            and curp like '${curp}%'
                            and paterno like '${paterno}%'
                            and materno like '${materno}%'
                            and nombre like '%${nombre}%'
                            and tnom.id_tipo_nomina like '%${nomina}%'
                            and apagar.id_tipo_pago like '%${id_tipo_pago}%'
                            and qna_pago like '%${qna_pago}%'
                        
                        `
        if (seccion)
            query+= ` and id_seccion = '${seccion}'` 
        
        if (id_nom_apagar)
            query+= ` and id_nom_apagar = '${id_nom_apagar}'` 
        

         query+= ' order by qna_pago desc , nomina, id_seccion, curp, consecutivo'

       // console.log(query)

        const pool = await dbConnection()
        const result = await pool.request().query(query)
        console.log(query)
        console.log('Nominas A Pagar Obtenidas')

        res.status(200).json({
            msg: `${result.rowsAffected[0] > 0 ?'Nominas a pagar se consulto correctamente':'No existe el registro' }`,
            total:result.rowsAffected[0],
            datos:result.recordset,  
        })

    }catch(error){
        console.error('Error al consultar: ', error)
        res.status(500).json({
            msg:'Error al consultar el registro.-> ' + error.message
        })
    }
    finally{
        sql.close
    }

}

//Se obtiene el Detalle Historico de plazas y conceptos usados para el calculo del pago. 
//Este es un historico que no cambia aun cuando el origen haya cambiado por algun ajuste.
const obtenNomDetallePagado = async(req,res)=>{

    const {
        id_trabajador='', 
        curp='',
        paterno='',
        materno='',
        nombre='',
        nomina='',
        id_tipo_pago='', 
        qna_pago='',
        seccion='',
        id_nom_apagar='' } = req.query

    if (id_trabajador==='' && curp==='' 
        && paterno==='' && materno===''
        && nombre==='' && nomina===''
        && id_tipo_pago==='' && qna_pago===''
        && seccion==='' && id_nom_apagar===''
        ){

        return res.status(400).json({ 
            msg:'Debe ingresar al menos un filtro de busqueda.'
        })
    }

    try{
        let query = `SELECT
                        ROW_NUMBER() OVER(ORDER BY hist.id_nom_apagar , plaza, perc_ded, concepto  ) as no,
                        hist.id_nom_apagar
                        ,curp
                        ,(paterno+' '+isnull(materno,'')+' '+ nombre) as nombre
                        ,consecutivo as '# pago'
                        , plaza
                        , perc_ded
                        , concepto
                        ,importe
                        ,sec_plaza
                        ,sec_persona
                        ,nivel
                        ,zona
                        ,hist.qna_pago
                        ,RTRIM(hist.nomina) as nomina
                        ,tpago.tipo_pago
                    FROM Nominas_Pagadas_Hist hist
                        inner join Nominas_APagar apagar on apagar.id_nom_apagar = hist.id_nom_apagar
                        inner join Mtro_Nominas mnom on mnom.id_nom_mtro = apagar.id_nom_mtro
                        inner join Maestro mtro on mtro.id_trabajador = mnom.id_trabajador
                        inner join Cat_Tipo_Nomina tnom on tnom.id_tipo_nomina = mnom.id_tipo_nomina
                        inner join Cat_Tipo_Pago tpago on tpago.tipo_pago = hist.tipo_pago
                    WHERE
                        hist.id_nom_apagar like '${id_nom_apagar}%'
                        AND sec_persona like '${seccion}'
                        and tnom.id_tipo_nomina like '%${nomina}%'
                        AND tpago.id_tipo_pago like '%${id_tipo_pago}%'
                        AND curp like '%${curp}%'
                        AND paterno like '${paterno}%'
                        AND materno like '${materno}%'
                        AND nombre like '%${nombre}%'
                        AND mtro.id_trabajador like '%${id_trabajador}%'
                        AND hist.qna_pago like '%${qna_pago}%'

                    order by hist.id_nom_apagar , plaza, perc_ded, concepto `

       // 

        const pool = await dbConnection()
        const result = await pool.request().query(query)
        console.log('Nomina Detalle Pagada Obtenida')
        console.log(query)

        res.status(200).json({
            msg: `${result.rowsAffected[0] > 0 ?'Historico de pago se consulto correctamente':'No existe el registro' }`,
            total:result.rowsAffected[0],
            datos:result.recordset,  
        })

    }catch(error){
        console.error('Error al consultar: ', error)
        res.status(500).json({
            msg:'Error al consultar el registro.-> ' + error.message
        })
    }
    finally{
        sql.close
    }

}

//Se obtiene de BD liquido calculado sobre el pago al maestro.
const obtenLiquidoPagado = async(req,res)=>{
   
    const {
        id_trabajador='', 
        curp='',
        paterno='',
        materno='',
        nombre='',
        nomina='',
        id_tipo_pago='', 
        qna_pago='',
        seccion='',
        id_nom_apagar='' } = req.query

    if (id_trabajador==='' && curp==='' 
        && paterno==='' && materno===''
        && nombre==='' && nomina===''
        && id_tipo_pago==='' && qna_pago===''
        && seccion==='' && id_nom_apagar===''
        ){

        return res.status(400).json({ 
            msg:'Debe ingresar al menos un filtro de busqueda.'
        })
    }

    try{
        let query = `select
                        ROW_NUMBER() OVER(ORDER BY hist.qna_pago desc , tnom.nomina, id_seccion, curp, consecutivo  ) as no,
                        id_nom_liq_hist
                       
                        ,hist.id_nom_apagar
                        ,mtro.id_trabajador
                        ,curp
                        ,(paterno+' '+isnull(materno,'')+' '+ nombre) as nombre
                        ,consecutivo as '# pago'
                        ,percepcion,deduccion
                        ,liquido
                        ,banco
                        ,isnull(no_cuenta,'') as no_cuenta
                        ,isnull(cve_beneficiario,'') as cve_beneficiario
                        ,isnull(contrato_enlace,'') as contrato_enlace
                        ,id_seccion as seccion
                        ,hist.qna_pago
                        ,RTRIM(hist.nomina) as nomina
                        ,tpago.tipo_pago
                        ,hist.fecha_alta
                    FROM Nominas_Liquido_Hist hist
                        inner join Nominas_APagar apagar on apagar.id_nom_apagar = hist.id_nom_apagar
                        inner join Mtro_Nominas mnom on mnom.id_nom_mtro = apagar.id_nom_mtro
                        inner join Maestro mtro on mtro.id_trabajador = mnom.id_trabajador
                        inner join Cat_Tipo_Nomina tnom on tnom.id_tipo_nomina = mnom.id_tipo_nomina
                        inner join Cat_Tipo_Pago tpago on tpago.tipo_pago = hist.tipo_pago
                    WHERE
                            hist.id_nom_apagar like '${id_nom_apagar}%'
                        
                            and tnom.id_tipo_nomina like '%${nomina}%'
                            AND tpago.id_tipo_pago like '%${id_tipo_pago}%'
                            AND curp like '%${curp}%'
                            AND paterno like '${paterno}%'
                            AND isnull(materno,'') like '${materno}%'
                            AND nombre like '%${nombre}%'
                            AND mtro.id_trabajador like '%${id_trabajador}%'
                            AND hist.qna_pago like '%${qna_pago}%'
                    `

        if(seccion)
            query+= `  AND id_seccion = '${seccion}'`            


        query+= `    order by hist.qna_pago desc , tnom.nomina, id_seccion, curp, consecutivo`
        //console.log(query)

        const pool = await dbConnection()
        const result = await pool.request().query(query)
        console.log(query)
        console.log('Liquido Obtenido')
        
        res.status(200).json({
            msg: `${result.rowsAffected[0] > 0 ?'Liquido de pago se consulto correctamente':'No existe el registro' }`,
            total:result.rowsAffected[0],
            datos:result.recordset,  
        })

    }catch(error){
        console.error('Error al consultar: ', error)
        res.status(500).json({
            msg:'Error al consultar el registro.-> ' + error.message
        })
    }
    finally{
        sql.close
    }
}

// Los 2 siguientes ENDPOINTS para los casos que es necesario excluir una seccion o un maestro del calculo de nomina
const excluirSeccionGet = async(req,res)=>{}

const excluirSeccionPOST = async(req,res)=>{

    const {
        seccion,
        qna_pago,
        id_tipo_nomina,
        usuario
    }= req.body

    try{
            const query = `INSERT INTO NOMINA_SECCEXCLUIDA
                            (
                                qna_pago,
                                id_tipo_nomina,
                                seccion,
                                pagar,
                                usuario,
                                fecha_alta
                            )
                            VALUES (
                                '${qna_pago}'
                                '${id_tipo_nomina}',
                                '${seccion}',
                                'no',
                                '${usuario}',
                                getdate()
                            )
                            `
        console.log('NOMINA_SECCIONEXCLUIDA')
        console.log(query)

        const pool = await dbConnection()
        const result = await pool.request().query(query)

        res.status(200).json({
        mesg:'El registro se ha dado de alta exitosamente',
        datos: req.body
        })

    }catch(error){
        console.error('Error al insertar el registro:', error)
        res.status(500).json({
            msg:'Error al insertar el registro '
        })
    }
    finally{
        sql.close
    }
    
}

const excluirMaestroGet = async(req,res)=>{
    const {
            id_trabajador='', 
            curp='',
            nomina='',
            qna_pago='',
            seccion='',
            pagare='',
            id_tipo_exclusion=''
         } = req.query

    if (id_tipo_exclusion==='')
    {
        return res.status(400).json({ 
            msg:'Debe ingresar el tipo de exclusion'
        })
    }

    let query = ''

    if (id_tipo_exclusion == '1') //EXCLUSION POR MAESTRO
    {
        console.log('Consulta por mtro')

        if (id_trabajador==='' && curp==='' 
            && nomina==='' && qna_pago===''
            && seccion===''  && pagare==='' ){
                return res.status(400).json({ msg:'Debe ingresar al menos un filtro de busqueda para maestro.'
            })
        }

        query = `SELECT 
                        ROW_NUMBER() OVER(ORDER BY tiponom.nomina, mtro.id_seccion, mtro.curp) as no,
                        id, mtro.id_trabajador, curp,(paterno+' '+materno+' '+nombre) as nombre, id_seccion, RTRIM(nomina) as nomina, qna_pago, pagar
                        FROM [dbo].[Nomina_MtroExcluido] ex
                        inner join Mtro_Nominas nom on nom.id_nom_mtro = ex.id_nom_mtro
                        inner join Cat_Tipo_Nomina tiponom on tiponom.id_tipo_nomina = nom.id_tipo_nomina
                        inner join Maestro mtro on mtro.id_trabajador = nom.id_trabajador
                    where 
                            nom.id_trabajador like '%${id_trabajador}%'
                            and curp like '${curp}%'
                            and tiponom.id_tipo_nomina like '${nomina}%'
                            and qna_pago like '${qna_pago}%'
                            and pagar like '${pagare}%'    
                    `
        if (seccion)
        query+= ` and id_seccion = '${seccion}' `

        query+= `order by tiponom.nomina, mtro.id_seccion, mtro.curp `
    }

    if (id_tipo_exclusion == '2') //EXCLUSION POR SECCION
    {
        console.log('Consulta por seccion')

        if (nomina==='' && qna_pago===''
        && seccion===''  && pagare==='' ){
            return res.status(400).json({ msg:'Debe ingresar al menos un filtro de busqueda para seccion.'
        })
        }
           
        query = `SELECT 
                        ROW_NUMBER() OVER(order by seccion, nomina, qna_pago desc, pagar) as no,
                        seccion, RTRIM(nomina) as nomina, qna_pago, pagar
                from [dbo].[Nomina_SeccExcluida] ex
                        inner join Cat_Tipo_Nomina tiponom on tiponom.id_tipo_nomina = ex.id_tipo_nomina
                WHERE 
                        tiponom.id_tipo_nomina like '${nomina}%'
                        and qna_pago like '${qna_pago}%'
                        and pagar like '${pagare}%'
                `
        if (seccion)
        query+= ` and seccion = '${seccion}' `

        query+= ` order by seccion, nomina, qna_pago desc, pagar `
    }

    try{
        //console.log(query)

        const pool = await dbConnection()
        const result = await pool.request().query(query)
        console.log(query)
        console.log('Excluido Obtenido')
        
        res.status(200).json({
            msg: `${result.rowsAffected[0] > 0 ?'Maestro excluido se consulto correctamente':'No existe el registro' }`,
            total:result.rowsAffected[0],
            datos:result.recordset,  
        })

    }catch(error){
        console.error('Error al consultar: ', error)
        res.status(500).json({
            msg:'Error al consultar el registro.-> ' + error.message
        })
    }
    finally{
        sql.close
    }
}

const excluirMaestroPost = async(req,res)=>{
    const {
        id_nom_mtro,
        qna_pago,
        usuario
    }= req.body

    try{
            const query = `INSERT INTO NOMINA_MTROEXCLUIDO
                            (
                                qna_pago,
                                id_nom_mtro,
                                pagar,
                                usuario,
                                fecha_alta
                            )
                            VALUES (
                                '${qna_pago}'
                                '${id_nom_mtro}',
                                'no',
                                '${usuario}',
                                getdate()
                            )
                            `
        console.log('NOMINA_MTROEXCLUIDO')
        console.log(query)

        const pool = await dbConnection()
        const result = await pool.request().query(query)

        res.status(200).json({
        mesg:'El registro se ha dado de alta exitosamente',
        datos: req.body
        })

    }catch(error){
        console.error('Error al insertar el registro:', error)
        res.status(500).json({
            msg:'Error al insertar el registro '
        })
    }
    finally{
        sql.close
    }
}

// ******

module.exports = {
    obtenNomApagar,
    obtenNomDetallePagado,
    obtenLiquidoPagado,
    excluirSeccionPOST,
    excluirMaestroPost,
    excluirMaestroGet,
    excluirSeccionGet
}