const { dbConnection, sql } = require('../database/config.db')

const { isValidDateText, isValidDateText_noMenor_noMayor, calculaQuincena } = require('../helpers/calculaQna')

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
        id_tipo_subpago='',
        qna_pago='',
        seccion='',
        id_nom_apagar='',
        qna_calculo=''
         } = req.query

    if (id_trabajador==='' && curp==='' && id_tipo_pago==='' 
        && qna_pago==='' && paterno==='' && materno ==='' 
        && nombre ==='' && nomina === '' && seccion === ''
        && id_nom_apagar === '' && qna_calculo===''
        && id_tipo_subpago==='' 
        ){

        return res.status(400).json({ 
            msg:'Debe ingresar al menos un filtro de busqueda.'
        })
    }

    try{
        let query = `SELECT
                        ROW_NUMBER() OVER(ORDER BY qna_pago_hasta DESC, nomina, id_seccion, curp, consecutivo) as no,
                        id_nom_apagar
                        ,mtro.id_trabajador
                        ,curp
                        ,(paterno +' '+ isnull(materno,'')+' '+ nombre) as nombre
                        ,id_seccion as seccion
                        ,qna_calculo
                        ,ISNULL(qna_pago_desde,qna_pago_hasta) as qna_pago_desde
                        ,qna_pago_hasta
                        ,consecutivo as pago
                        ,RTRIM(nomina) as nomina
                        ,tipo_pago as 'tipo pago'
                        ,subpago.sub_pago as 'sub pago'
                        ,pago.usuario
                        
                    FROM Nominas_APagar apagar
                        inner join Mtro_Nominas         mnom on mnom.id_nom_mtro = apagar.id_nom_mtro
                        inner join Maestro              mtro on mtro.id_trabajador = mnom.id_trabajador
                        inner join Pago_Nomina          pago on pago.id_pago_nomina = apagar.id_pago_nomina
                        inner join Cat_Tipo_Nomina      tnom on tnom.id_tipo_nomina = mnom.id_tipo_nomina
                        inner join Cat_Tipo_Pago        tpago on tpago.id_tipo_pago = apagar.id_tipo_pago
                        inner join Cat_Tipo_SubPago    subpago on subpago.id_tipo_subpago = apagar.id_tipo_subpago

                        WHERE
                            mtro.id_trabajador like '%${id_trabajador}%'
                            and curp like '${curp}%'
                            and paterno like '${paterno}%'
                            and materno like '${materno}%'
                            and nombre like '%${nombre}%'
                            and tnom.id_tipo_nomina like '%${nomina}%'
                            and apagar.id_tipo_pago like '%${id_tipo_pago}%'
                            and apagar.id_tipo_subpago like '%${id_tipo_subpago}%'
                            and qna_pago_hasta like '%${qna_pago}%'
                            and qna_calculo like '%${qna_calculo}%'
                        `
        if (seccion)
            query+= ` and id_seccion = '${seccion}'` 
        
        if (id_nom_apagar)
            query+= ` and id_nom_apagar = '${id_nom_apagar}'` 
        

         query+= ' order by qna_calculo, nomina, id_seccion, curp, consecutivo'

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
        id_tipo_subpago='', 
        qna_pago='',
        seccion='',
        id_nom_apagar='',
        qna_calculo=''
    } = req.query

    console.log('Obteniendo Detalle Pagado ...')

    if (id_trabajador==='' && curp==='' 
        && paterno==='' && materno===''
        && nombre==='' && nomina===''
        && id_tipo_pago==='' && qna_pago===''
        && seccion==='' && id_nom_apagar===''
        && qna_calculo ==='' &&  id_tipo_subpago===''
        ){
            console.log('Error de parametros al consultar detalle')
            return res.status(400).json({ 
                    msg:'Debe ingresar al menos un filtro de busqueda.'
              })
    }

    try{

        let condiciones =''
        let query = `SELECT
                        ROW_NUMBER() OVER(ORDER BY hist.id_nom_apagar , plaza, perc_ded, concepto  ) as no,
                        hist.id_nom_apagar
                        ,curp
                        ,(paterno+' '+isnull(materno,'')+' '+ nombre) as nombre
                        ,consecutivo as '# pago'
                        , plaza
                        , perc_ded as 'P/D'
                        , concepto
                        ,importe
                        ,sec_plaza as 'S.Plza'
                        ,sec_persona as 'S.Per'
                        ,nivel
                        ,zona
                        ,qna_calculo
                        ,apagar.qna_pago_desde as qna_desde
                        ,apagar.qna_pago_hasta as qna_hasta
                        ,tnom.nomina
                        ,tpago.tipo_pago as 'tipo pago'
                        ,subpago.sub_pago as 'sub pago'
                        --hist.* ,' - ' as HIST ,apagar.*,' - ' as APAGAR ,mnom.*,' - ' as MTRONOM, pago.*,' - ' as PAGO, mtro.*
                    FROM Nominas_Pagadas_Hist hist
                        inner join Nominas_APagar   apagar on apagar.id_nom_apagar = hist.id_nom_apagar
                        inner join Mtro_Nominas     mnom on mnom.id_nom_mtro = apagar.id_nom_mtro
                        inner join Pago_Nomina      pago on pago.id_pago_nomina = apagar.id_pago_nomina
                        inner join Maestro          mtro on mtro.id_trabajador = mnom.id_trabajador
                        inner join Cat_Tipo_Nomina  tnom on tnom.id_tipo_nomina = mnom.id_tipo_nomina
                        inner join Cat_Tipo_Pago    tpago on tpago.id_tipo_pago = apagar.id_tipo_pago
                        inner join Cat_Tipo_SubPago subpago on subpago.id_tipo_subpago = apagar.id_tipo_subpago 
                    `

        if (id_nom_apagar!=='')
            condiciones = `&hist.id_nom_apagar like '${id_nom_apagar}%'` 
        if (seccion!=='')
            condiciones = condiciones +`&sec_persona = '${seccion}'`
        if (nomina!=='')
            condiciones = condiciones +`&tnom.id_tipo_nomina = '${nomina}'`
        if (id_tipo_pago!=='')
            condiciones = condiciones +`&tpago.id_tipo_pago = '${id_tipo_pago}'`
        if (id_tipo_subpago!=='')
            condiciones = condiciones +`&subpago.id_tipo_subpago = '${id_tipo_subpago}'`
        if (curp!=='')
            condiciones = condiciones +`&curp like '%${curp}%'`
        if(paterno!=='')
            condiciones = condiciones +`&paterno like '${paterno}%'`
        if(materno!=='')
            condiciones = condiciones +`&materno like '${materno}%'`
        if(nombre!=='')
            condiciones = condiciones +`&nombre like '${nombre}%'`
        if(id_trabajador!=='')
            condiciones = condiciones +`&mtro.id_trabajador like '%${id_trabajador}%'`
        if(qna_calculo!=='')
            condiciones = condiciones +`&pago.qna_calculo = '${qna_calculo}'`
        if(qna_pago!=='')
            condiciones = condiciones +`&apagar.qna_pago_hasta = '${qna_pago}'`
            
        let nuevaCadena = condiciones.split('&').join(" and ");
            nuevaCadena = nuevaCadena.replace(/\band\b/, '');

        query = query + 'WHERE ' + nuevaCadena + ' order by hist.id_nom_apagar , plaza, perc_ded, concepto'
        console.log (query)

        const pool = await dbConnection()
        const result = await pool.request().query(query)
        console.log('Nomina Detalle Pagada Obtenida')
        //console.log(query)

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

const obtenDetallePagadoMaestro= async(req,res)=>{
    const {
        id_trabajador='', 
        qna_calculo='',
        no_pago=''
    } = req.query

    console.log('Obteniendo Detalle De Maestro Pagado ...')

    if (id_trabajador==='' && qna_calculo ==='' &&  no_pago===''
        ){
            console.log('Error de parametros al consultar detalle')
            return res.status(400).json({ 
                    msg:'Debe ingresar al menos un filtro de busqueda.'
              })
    }

    try{

        let query = `select 
                        ROW_NUMBER() OVER(ORDER BY  qna_calculo,id_trabajador, plaza, perc_ded, concepto, importe  ) as no
                        ,id_trabajador
                        ,qna_calculo
                        ,consecutivo as 'pago'
                        ,tnom.nomina
                        ,plaza
                        ,perc_ded as 'P/D'
                        ,concepto
                        ,importe
                        ,sec_plaza
                        ,sec_persona
                        ,nivel
                        ,zona
                        ,detalle.fecha_alta
                    from Nominas_APagar apagar
                        inner join Pago_Nomina					pago on pago.id_pago_nomina = apagar.id_pago_nomina 
                        inner join Mtro_Nominas					nom on nom.id_nom_mtro = apagar.id_nom_mtro
                        inner join [dbo].[Nominas_Pagadas_Hist] detalle on detalle.id_nom_apagar = apagar.id_nom_apagar
                        inner join Cat_Tipo_Nomina				tnom on tnom.id_tipo_nomina = nom.id_tipo_nomina
                    where qna_calculo = '${qna_calculo}'
                            and consecutivo = '${no_pago}'
                            and id_trabajador = '${id_trabajador}'
                    order by qna_calculo,id_trabajador, plaza, perc_ded, concepto, importe
                    `
       
        console.log (query)

        const pool = await dbConnection()
        const result = await pool.request().query(query)
        console.log('Nomina Detalle Pagada Obtenida')
        //console.log(query)

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
        id_tipo_subpago='', 
        qna_pago='',
        seccion='',
        id_nom_apagar='',
        qna_calculo=''
    } = req.query

    if (id_trabajador==='' && curp==='' 
        && paterno==='' && materno===''
        && nombre==='' && nomina===''
        && id_tipo_pago==='' && qna_pago===''
        && seccion==='' && id_nom_apagar===''
        && id_tipo_subpago==='' &&  qna_calculo===''
        ){

        return res.status(400).json({ 
            msg:'Debe ingresar al menos un filtro de busqueda.'
        })
    }

    try{
        let condiciones =''
        let query = `select
                        ROW_NUMBER() OVER(ORDER BY liq.qna_pago desc , tnom.nomina, id_seccion, curp, consecutivo  ) as no,
                        id_nom_liq_hist
                       
                        ,liq.id_nom_apagar
                        ,mtro.id_trabajador
                        ,curp
                        ,(paterno+' '+isnull(materno,'')+' '+ nombre) as nombre
                        ,consecutivo as 'pago'
                        ,percepcion,deduccion
                        ,liquido
                        ,banco
                        ,isnull(no_cuenta,'') as no_cuenta
                        ,liq.no_orden
                        ,isnull(cve_beneficiario,'') as cve_beneficiario
                        ,isnull(contrato_enlace,'') as contrato_enlace
                        ,id_seccion as seccion
                        ,pago.qna_calculo
                        ,apagar.qna_pago_desde as qna_desde
						,apagar.qna_pago_hasta as qna_hasta
                        ,apagar.xdias
                        ,tnom.nomina
                        ,tpago.tipo_pago
                        ,tspago.sub_pago
                        ,liq.fecha_alta
                    FROM  Nominas_APagar apagar
                    inner join Nominas_Liquido_Hist liq on liq.id_nom_apagar = apagar.id_nom_apagar
                    inner join Pago_Nomina pago on pago.id_pago_nomina = apagar.id_pago_nomina
                    inner join Mtro_Nominas nom on nom.id_nom_mtro = apagar.id_nom_mtro
                    inner join Maestro mtro on mtro.id_trabajador = nom.id_trabajador
                    inner join Cat_Tipo_Nomina tnom on tnom.id_tipo_nomina = nom.id_tipo_nomina
                    inner join Cat_Tipo_Pago tpago on tpago.id_tipo_pago = apagar.id_tipo_pago
                    inner join Cat_Tipo_SubPago tspago on tspago.id_tipo_subpago = apagar.id_tipo_subpago

                    `

        if (id_nom_apagar!=='')
            condiciones = `&hist.id_nom_apagar like '${id_nom_apagar}%'` 
        if (seccion!=='')
            condiciones = condiciones +`&mtro.id_seccion = '${seccion}'`
        if (nomina!=='')
            condiciones = condiciones +`&tnom.id_tipo_nomina = '${nomina}'`
        if (id_tipo_pago!=='')
            condiciones = condiciones +`&tpago.id_tipo_pago = '${id_tipo_pago}'`
        if (id_tipo_subpago!=='')
            condiciones = condiciones +`&subpago.id_tipo_subpago = '${id_tipo_subpago}'`
        if (curp!=='')
            condiciones = condiciones +`&curp like '%${curp}%'`
        if(paterno!=='')
            condiciones = condiciones +`&paterno like '${paterno}%'`
        if(materno!=='')
            condiciones = condiciones +`&materno like '${materno}%'`
        if(nombre!=='')
            condiciones = condiciones +`&nombre like '%${nombre}%'`
        if(id_trabajador!=='')
            condiciones = condiciones +`&mtro.id_trabajador like '%${id_trabajador}%'`
        if(qna_calculo!=='')
            condiciones = condiciones +`&pago.qna_calculo = '${qna_calculo}'`
        if(qna_pago!=='')
            condiciones = condiciones +`&apagar.qna_pago_hasta = '${qna_pago}'`
            
        let nuevaCadena = condiciones.split('&').join(" and ");
            nuevaCadena = nuevaCadena.replace(/\band\b/, '');

        query = query + ' WHERE ' + nuevaCadena + ' order by apagar.qna_pago_hasta , tnom.nomina, id_seccion, curp, consecutivo'
        console.log (query)


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

const excluirPost = async(req,res)=>{

    const {
        seccion,
        qna_pago,
        id_tipo_nomina,
        id_trabajador,
        usuario='obalmaceda',
        tipo_Exclusion,
    }= req.body
    
    console.log("Esperando a guardar..")
    console.log(req.body)

    let query=''

    if (tipo_Exclusion==='maestro')
    {
        query = `INSERT INTO 
                    Nomina_MtroExcluido
                    (
                        id_nom_mtro,
                        qna_pago,
                        pagar,
                        fecha_alta,
                        usuario
                    )
                    select id_nom_mtro  , '${qna_pago}','NO',getdate(),'obalmaceda'
                        from [dbo].[Mtro_Nominas]
                        where id_trabajador = '${id_trabajador}' and id_tipo_nomina = '${id_tipo_nomina}' and estatus = 1
        `
    }else{
        query = `INSERT INTO 
                    NOMINA_SECCEXCLUIDA
                    (
                        qna_pago,
                        id_tipo_nomina,
                        seccion,
                        pagar,
                        usuario,
                        fecha_alta
                    )
                VALUES (
                    '${qna_pago}',
                    '${id_tipo_nomina}',
                    '${seccion}',
                    'NO',
                    '${usuario}',
                    getdate()
                )
                `
    }



   try{
        console.log(query)

        const pool = await dbConnection()
        const result = await pool.request().query(query)

        res.status(200).json({
        msg:'El registro se ha dado de alta correctamente',
        datos: req.body
        })

    }catch(error){
        console.error('Error al insertar el registro:', error)
        res.status(500).json({
            msg:'El registro ya existe',
            error: error.originalError.info
        })
    }
    finally{
        sql.close
    }

}

const excluirGet = async(req,res)=>{
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
    console.log("tipo de Exclusion ->" + id_tipo_exclusion)

    if (id_tipo_exclusion == 'maestro') //EXCLUSION POR MAESTRO
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
                    where `
      
        let condiciones=''
        if (id_trabajador)
            condiciones+=  ` nom.id_trabajador like '%${id_trabajador}%'`
        if(curp)
            condiciones+= (condiciones) ? ` and curp like '${curp}%'` : ` curp like '${curp}%'`
        if(nomina)
            condiciones+= (condiciones) ? ` and tiponom.id_tipo_nomina like '${nomina}%'` : ` tiponom.id_tipo_nomina like '${nomina}%'`
        if(qna_pago)
            condiciones+= (condiciones) ? ` and qna_pago like '${qna_pago}%'` : ` qna_pago like '${qna_pago}%'`
        if(pagare)
            condiciones+= (condiciones) ? ` and pagar like '${pagare}%'` : ` pagar like '${pagare}%'`
        if (seccion)
            condiciones+= (condiciones) ? ` and id_seccion = '${seccion}' ` : ` id_seccion = '${seccion}' `

        query+= condiciones
        query+= ` order by tiponom.nomina, mtro.id_seccion, mtro.curp, qna_pago desc, pagar `
    }

    if (id_tipo_exclusion == 'seccion') //EXCLUSION POR SECCION
    {
        console.log('Consulta por seccion')

        if (nomina==='' && qna_pago===''
        && seccion===''  && pagare==='' ){
            return res.status(400).json({ msg:'Debe ingresar al menos un filtro de busqueda para seccion.'
        })
        }
           
        query = `SELECT 
                        ROW_NUMBER() OVER(order by seccion, nomina, qna_pago desc, pagar) as no,
                        id,seccion, RTRIM(nomina) as nomina, qna_pago, pagar
                from [dbo].[Nomina_SeccExcluida] ex
                        inner join Cat_Tipo_Nomina tiponom on tiponom.id_tipo_nomina = ex.id_tipo_nomina
                WHERE 
                        tiponom.id_tipo_nomina like '${nomina}%'
                        and qna_pago like '${qna_pago}%'
                        and pagar like '${pagare}%'
                `
        if (seccion)
        query+= ` and seccion = '${seccion}' `

        query+= ` order by seccion, nomina, qna_pago desc, pagar`
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
            msg:'Error al consultar el registro.-> ' + error.message,
            error: error.originalError.info

        })
    }
    finally{
        sql.close
    }
}

const excluirPut = async(req,res)=>{
   
    console.log(req.body)
    const {
        id,
        qna_pago,
        usuario='obalmaceda',
        pagar,
        tipo_exclusion
    }= req.body

    let query=''

    if (tipo_exclusion==='maestro')
    {
        query = `UPDATE NOMINA_MTROEXCLUIDO
                    SET 
                        pagar = '${pagar}', 
                        fecha_actualizacion = getdate(), 
                        usuario = '${usuario}'
                    WHERE id = ${id}
                `
    }else{
        query = `UPDATE Nomina_SeccExcluida
                    SET
                        pagar = '${pagar}', 
                        fecha_actualizacion = getdate(), 
                        usuario = '${usuario}'
                    WHERE id = ${id}
                `
    }
    
    

    try{

        console.log(query)

        const pool = await dbConnection()
        const result = await pool.request().query(query)

        res.status(200).json({
        msg:'El registro se ha actualizado correctamente',
        datos: req.body
        })
        console.log('Guardando UPDATE Exclusion !!')

    }catch(error){
        console.error('Error al insertar el registro:', error)
        res.status(500).json({
            msg:'Error al insertar el registro ',
            error: error.originalError.info
        })
    }
    finally{
        sql.close
    }
}
// ******


//* * * * * *    CALCULO DE NOMINA * * * * * * */
//Sirve para crear una Nomina la cual contendra todos los calculos ordinarios y adicionales de la QNA indicada.
const crearNomina = async(req,res)=>{
    const {
        qna_calculo='',
        usuariosistema='sinusuario',
    }= req.body

    console.log(req.body)

    try{
    
    if (qna_calculo === '' || qna_calculo.length !=6 ){
        console.log('Falta parametro qna_calculo')
        res.status(400).json({
            msg: 'Falta el parametro qna_calculo correcto',
         })
         return
    }

    let valida = isValidDateText_noMenor_noMayor(qna_calculo)
    if(!valida)
    {
        console.log(`La Quincena Pago es anterior o mayor a 1 quincena respecto a la qna '${calculaQuincena()}' actual`)
        res.status(400).json({
            msg: `La Quincena Pago es anterior o mayor a 1 quincena respecto a la qna '${calculaQuincena()}' actual`,
         })
    }
    else{
         //Validar si el registro ya existe para la qna indicada.
        let query = `SELECT id_pago_nomina FROM Pago_Nomina where qna_calculo = '${qna_calculo}' `

        const pool = await dbConnection()
        const result = await pool.request().query(query)

        let existe = result.rowsAffected[0]
        
        if(existe >0) //Ya existe valor
        {
            console.log(`Registro ya existe para la quincena ${qna_calculo}`)
            res.status(400).json({
                msg:`Registro ya existe para la quincena ${qna_calculo}`,
            })
        }
        else  //Se procede con la creación.
        { 
            query =  `INSERT INTO Pago_Nomina ( qna_calculo, activa, fecha_creacion, usuario )
                        VALUES ( '${qna_calculo}', 'SI', getdate(), '${usuariosistema}' ) `
            
            await pool.request().query(query)

            res.status(200).json({
                msg:'El registro se ha dado de alta correctamente',
                datos: req.body
            })
        }
    }

    }catch(error){
        console.error('Error al insertar el registro:', error)
        res.status(500).json({
            msg:'El registro ya existe',
            error: error.originalError.info
        })
    }
    finally{
        sql.close()
    }
}

//Sirve para actualizar el estado activo de la nomina y poder generar mas calculos para la qna indicada
const actualizarNomina = async(req,res)=>{

    const {
        id_pago_nomina='',
        usuariosistema='sinusuario',
    }= req.body

    if (id_pago_nomina === ''){
        console.log('Falta parametro id_pago_nomina')
        res.status(400).json({
            msg: 'Falta el parametro id_pago_nomina',
         })
         return
    }

    console.log('actualizar Nomina')
    try{
        let query = `UPDATE PAGO_NOMINA
                        SET activa = 'NO', fecha_actualizacion = getdate(), usuario= '${usuariosistema}'
                        WHERE id_pago_nomina = '${id_pago_nomina}'`

        const pool = await dbConnection()
        let resultado = await pool.request().query(query)

        let mensaje =''
        if(resultado.rowsAffected[0] > 0 )
        {
            mensaje= 'La quincena se ha cerrado correctamente'
        }
        else
        {
            mensaje='No se actualizo el registro o no existe tal registro'
        }
       
        res.status(200).json({
            msg:mensaje,
            datos: req.body
        })

    }
    catch(error){
        console.error('Error al actualizar el registro:', error)
        res.status(500).json({
            msg:'Error al actualizar el registro ',
            error: error.originalError.info
        })
    }
    finally{
        sql.close()
    }
}

//Sirve para consultar el estatus activo de la nomina con la qna indicada.
const consultarEstatusNomina = async(req,res)=>{
    const {
        qna_pago='',
    }= req.body

    try{
        let query = `SELECT top(10) * from PAGO_NOMINA `

        if(qna_pago !== ''){
            query+=`where qna_pago = '${qna_pago}' `
        }

        
         query = `select id_pago_nomina, qna_calculo from [dbo].[Pago_Nomina] where activa = 'SI'`


        const pool = await dbConnection()
        let result = await pool.request().query(query)

        res.status(200).json({
            msg: `${result.rowsAffected[0] > 0 ?'Liquido de pago se consulto correctamente':'No existe el registro' }`,
            total:result.rowsAffected[0],
            datos:result.recordset,  
        })

    }
    catch(error){
        console.error('Error al actualizar el registro:', error)
        res.status(500).json({
            msg:'Error al actualizar el registro ',
            error: error.originalError.info
        })
    }
    finally{
        sql.close()
    }
}

//Sirve para calcular la nomina en base a los parametros indicados y ejecutar el SP
const calcularNomina = async(req,res)=>{
    const {
        nomina 	= '',      // 1.CES, 2.CEN, 3.CONTRATURNO, 4.ESPECIAL, 5.PRESTACIONES
        id_tipo_pago       = '',      // 1.ORDINARIA, 6.ADICIONAL
        id_tipo_subpago    = '',      // 1.SALARIO, 2.PRESTACION, 3.RETROACTIVO, 4.AGUINALDO
        forma_pago      ,       // DEPOSITO , NO_ORDEN
        seccion         ,     // si se especifica solo se calcula para la seccion indicada.
        id_trabajador   ,//= '',     // si se especifica solo se calcula para el mtro indicado.
        qna_pago_desde  ,       // se indica la qna_pago desde que se paga.
        qna_pago        = '',       // se indica la qna_pago hasta la cual se paga
        qna_calculo     = '',       // se indica la qna_calculo actual
        norden          ,       // Numero de Orden a partir del cual se le asigna al pago del maestro.
        usuariosistema  = '',
        previsualizar        = 'SI',	    //- Indica si se calcula en tablas temporales para previsualizar el calculo o se afecten las tablas reales.
    }= req.body

    let params_faltantes=''

    console.log(req.body)

    if (nomina === '' ){
        params_faltantes += ' - Tipo de nomina'
    }
    if (id_tipo_pago === '' ){
        params_faltantes += ' - Tipo de pago'
    }
    if (id_tipo_subpago === '' ){
        params_faltantes += ' - Tipo subpago'
    }
    /*if (forma_pago !== '' && (forma_pago!=='DEPOSITO' || forma_pago!=='NO_ORDEN') ){
        params_faltantes += ' - Forma de pago'
    }*/
   /* if (seccion !== ''){
      if(seccion.length > 2){
        params_faltantes += ' - Seccion'
        }
    }*/
    /*if (id_trabajador === '' ){
        params_faltantes += ' - Id trabajador'
    }*/
    if(qna_pago_desde){
        console.log("qna_pago_desde:" + qna_pago_desde)
        if ((qna_pago_desde.length !== 6 || isNaN(qna_pago_desde))){
            params_faltantes += ' - Quincena pago desde'
        }
    }
        

    if (qna_pago === '' || qna_pago.length !== 6 || isNaN(qna_pago)  ){
        params_faltantes += ' - Quincena pago hasta'
    }
    //if (qna_calculo === '' || qna_calculo.length !== 6 || isNaN(qna_calculo)  ){
    //    params_faltantes = ' qna_calculo '
    //}

    if (norden){
        if (isNaN(norden) )
            params_faltantes += ' - # orden'
    }   
    
    if (usuariosistema === ''){
        params_faltantes += ' - Usuario'
    }
    if (previsualizar === '' || (previsualizar!=='SI' && previsualizar!=='NO') ){
        params_faltantes += ' - previsualizar '
    }

    if (params_faltantes!=='')
    {
        console.log('ERROR CONTROLADO')
        res.status(400).json({
            msg: 'Error al enviar los siguientes parametros: ' + params_faltantes
         })
         return
    }

    try{
        let query = `EXEC GeneraNomina 
                        @id_tipo_nom, @tipo_pago, @tipo_subpago, 
                        @forma_pago, @seccion, @id_trabajador, 
                        @qna_pago_desde, @qna_pago_hasta, @qna_calculo, @norden, 
                        @usuario, @preview `

        const pool = await dbConnection()

        pool.on('infoMessage', (message) => {
            console.log('Mensaje de depuración:', message.message);
            });

        let result2 = await pool.request()
        .input('id_tipo_nom', sql.VarChar(1), nomina)
        .input('tipo_pago', sql.VarChar(1), id_tipo_pago)
        .input('tipo_subpago', sql.VarChar(1), id_tipo_subpago)
        .input('forma_pago', sql.VarChar(15), forma_pago)
        .input('seccion', sql.VarChar(2), seccion )
        .input('id_trabajador', sql.VarChar(80), id_trabajador)
        .input('qna_calculo', sql.VarChar(6), qna_calculo)
        .input('qna_pago_desde', sql.VarChar(6), qna_pago_desde)
        .input('qna_pago_hasta', sql.VarChar(6), qna_pago)
        .input('norden', sql.VarChar(6), norden)
        .input('usuario', sql.VarChar(20), usuariosistema)
        .input('preview', sql.VarChar(2), previsualizar)
        .output('mensaje', sql.VarChar(150))
        .output('mensaje2', sql.VarChar(150))
        .output('mensaje3', sql.VarChar(200))
        .execute('GeneraNomina')

        const resultSets = result2.recordsets;
        //console.log(result2.recordsets.length)
        //console.log(result2.output.mensaje)
        
        console.log(result2)
        //console.log(forma_pago)

        res.status(200).json({
            msg: `${result2.recordsets.length > 0 ?`Nomina Calculada, ${result2.output.mensaje}`:`No se genero ningun calculo, revise parametros. ${result2.output.mensaje}` }`,
            total:result2.recordsets.length,
            //datos:resultSets,  
            datos:result2.recordset,  
        })

    }
    catch(error){
        console.error('Error al calcular Nomina:', error)
        res.status(500).json({
            msg:'Error al calcular Nomina',
            error: error.originalError
        })
    }
    finally{
        sql.close()
    }

}

module.exports = {
    obtenNomApagar,
    obtenNomDetallePagado,
    obtenDetallePagadoMaestro,
    obtenLiquidoPagado,
    excluirPost,
    excluirGet,
    excluirPut,
    crearNomina,
    actualizarNomina,
    consultarEstatusNomina,
    calcularNomina,

}