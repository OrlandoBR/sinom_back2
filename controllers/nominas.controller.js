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
        qna_pago='',
        usuario='obalmaceda',
    }= req.body

    try{
    
    if (qna_pago === '' || qna_pago.length !=6 ){
        console.log('Falta parametro qna_pago')
        res.status(400).json({
            msg: 'Falta el parametro qna_pago correcto',
         })
         return
    }

    let valida = isValidDateText_noMenor_noMayor(qna_pago)
    if(!valida)
    {
        console.log(`La Quincena Pago es anterior o mayor a 1 quincena respecto a la qna '${calculaQuincena()}' actual`)
        res.status(400).json({
            msg: `La Quincena Pago es anterior o mayor a 1 quincena respecto a la qna '${calculaQuincena()}' actual`,
         })
    }
    else{
         //Validar si el registro ya existe para la qna indicada.
        let query = `SELECT id_pago_nomina FROM Pago_Nomina where qna_pago = '${qna_pago}' `

        const pool = await dbConnection()
        const result = await pool.request().query(query)

        let existe = result.rowsAffected[0]
        
        if(existe >0) //Ya existe valor
        {
            console.log('Registro ya existe para la quincena indicada')
            res.status(400).json({
                msg: 'Registro ya existe para la quincena indicada',
            })
        }
        else  //Se procede con la creación.
        { 
            query =  `INSERT INTO Pago_Nomina ( qna_pago, activa, fecha_creacion, usuario )
                        VALUES ( '${qna_pago}', 'SI', getdate(), '${usuario}' ) `
            
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
        usuario='obalmaceda',
    }= req.body

    if (id_pago_nomina === ''){
        console.log('Falta parametro id_pago_nomina')
        res.status(400).json({
            msg: 'Falta el parametro id_pago_nomina',
         })
         return
    }

    try{
        let query = `UPDATE PAGO_NOMINA
                        SET activa = 'NO', fecha_actualizacion = getdate(), usuario= '${usuario}'
                        WHERE id_pago_nomina = '${id_pago_nomina}'`

        const pool = await dbConnection()
        let resultado = await pool.request().query(query)

        let mensaje =''
        if(resultado.rowsAffected[0] > 0 )
        {
            mensaje= 'El registro se ha actualizado correctamente'
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

    if (qna_pago !== '' && qna_pago.length !=6 ){
        console.log('Falta parametro qna_pago')
        res.status(400).json({
            msg: 'Falta el parametro qna_pago correcto',
         })
         return
    }

    try{
        let query = `SELECT top(10) * from PAGO_NOMINA `

        if(qna_pago !== ''){
            query+=`where qna_pago = '${qna_pago}' `
        }

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
        id_tipo_nom  	= '',      // 1.CES, 2.CEN, 3.CONTRATURNO, 4.ESPECIAL, 5.PRESTACIONES
        tipo_pago       = '',      // 1.ORDINARIA, 6.ADICIONAL
        tipo_subpago    = '',      // 1.SALARIO, 2.PRESTACION, 3.RETROACTIVO, 4.AGUINALDO
        forma_pago      = '',       // DEPOSITO , NO_ORDEN
        seccion         = '%%',     // si se especifica solo se calcula para la seccion indicada.
        id_trabajador   = '%%',     // si se especifica solo se calcula para el mtro indicado.
        qna_pago_desde  = '',       // se indica la qna_pago desde que se paga.
        qna_pago_hasta  = '',       // se indica la qna_pago hasta la cual se paga
        qna_calculo     = '',       // se indica la qna_calculo actual
        norden          = '',       // Numero de Orden a partir del cual se le asigna al pago del maestro.
        usuario         = 'obalmaceda',
        preview         = 'SI',	    //- Indica si se calcula en tablas temporales para previsualizar el calculo o se afecten las tablas reales.
    }= req.body

    let params_faltantes=''

    if (id_tipo_nom === '' ){
        params_faltantes += ' id_tipo_nom '
    }
    if (tipo_pago === '' ){
        params_faltantes += ' tipo_pago '
    }
    if (tipo_subpago === '' ){
        params_faltantes += ' tipo_subpago '
    }
    if (forma_pago !== '' && (forma_pago!=='DEPOSITO' || forma_pago!=='NO_ORDEN') ){
        params_faltantes += ' forma_pago '
    }
    if (seccion !== '' && (seccion.length > 2)){
        params_faltantes += ' seccion '
    }
    if (id_trabajador === '' ){
        params_faltantes += ' id_trabajador '
    }
    if (qna_pago_desde !== '' && (qna_pago_desde.length !== 6 || !isNaN(qna_pago_desde))){
        params_faltantes += ' qna_pago_desde '
    }
    if (qna_pago_hasta === '' || qna_pago_hasta.length !== 6 || isNaN(qna_pago_hasta)  ){
        params_faltantes = ' qna_pago_hasta '
    }
    if (qna_calculo === '' || qna_calculo.length !== 6 || isNaN(qna_calculo)  ){
        params_faltantes = ' qna_calculo '
    }
    console.log(norden)
    if (norden !== '' && isNaN(norden) ){
        params_faltantes += ' norden '
    }
    if (usuario === ''){
        params_faltantes += ' usuario '
    }
    if (preview === '' || (preview!=='SI' && preview!=='NO') ){
        params_faltantes += ' preview '
    }

    if (params_faltantes!=='')
    {
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
        .input('id_tipo_nom', sql.VarChar(1), id_tipo_nom)
        .input('tipo_pago', sql.VarChar(1), tipo_pago)
        .input('tipo_subpago', sql.VarChar(1), tipo_subpago)
        .input('forma_pago', sql.VarChar(15), forma_pago)
        .input('seccion', sql.VarChar(2), seccion)
        .input('id_trabajador', sql.VarChar(10), id_trabajador)
        .input('qna_calculo', sql.VarChar(6), qna_calculo)
        .input('qna_pago_desde', sql.VarChar(6), qna_pago_desde)
        .input('qna_pago_hasta', sql.VarChar(6), qna_pago_hasta)
        .input('norden', sql.VarChar(6), norden)
        .input('usuario', sql.VarChar(20), usuario)
        .input('preview', sql.VarChar(2), preview)
        .output('mensaje', sql.VarChar(100))
        .execute('GeneraNomina')

        const resultSets = result2.recordsets;
        console.log(result2.recordsets.length)
        console.log(result2.output.mensaje)
        res.status(200).json({
            msg: `${result2.recordsets.length > 0 ?`Nomina Calculada, ${result2.output.mensaje}`:`No se genero ningun calculo, revise parametros. ${result2.output.mensaje}` }`,
            total:result2.recordsets.length,
            datos:resultSets,  
        })

    }
    catch(error){
        console.error('Error al calcular Nomina:', error)
        res.status(500).json({
            msg:'Error al calcular Nomina',
            error: error.originalError.info
        })
    }
    finally{
        sql.close()
    }

}


module.exports = {
    obtenNomApagar,
    obtenNomDetallePagado,
    obtenLiquidoPagado,
    excluirPost,
    excluirGet,
    excluirPut,
    crearNomina,
    actualizarNomina,
    consultarEstatusNomina,
    calcularNomina
}