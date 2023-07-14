const { dbConnection, sql } = require('../database/config.db')

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
                            and nomina like '%${nomina}%'
                            and apagar.id_tipo_pago like '%${id_tipo_pago}%'
                            and qna_pago like '%${qna_pago}%'
                            and id_seccion like '%${seccion}%'
                            and id_nom_apagar like '${id_nom_apagar}%'
                        `

         query+= ' order by qna_pago desc , nomina, curp, consecutivo'

       // console.log(query)

        const pool = await dbConnection()
        const result = await pool.request().query(query)
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
                        hist.id_nom_apagar
                        ,curp
                        ,(paterno+' '+isnull(materno,'')+' '+ nombre) as nombre
                        , plaza
                        , perc_ded
                        , concepto
                        ,importe
                        ,sec_plaza
                        ,sec_persona
                        ,nivel
                        ,zona
                        ,hist.qna_pago
                        ,RTRIM(nomina) as nomina
                        ,tipo_pago
                    FROM Nominas_Pagadas_Hist hist
                        inner join Nominas_APagar apagar on apagar.id_nom_apagar = hist.id_nom_apagar
                        inner join Mtro_Nominas mnom on mnom.id_nom_mtro = apagar.id_nom_mtro
                        inner join Maestro mtro on mtro.id_trabajador = mnom.id_trabajador
                    WHERE
                        hist.id_nom_apagar like '${id_nom_apagar}%'
                        AND sec_persona like '%${seccion}%'
                        AND nomina like '%${nomina}%'
                        AND tipo_pago like '%${id_tipo_pago}%'
                        AND curp like '%${curp}%'
                        AND paterno like '${paterno}%'
                        AND materno like '${materno}%'
                        AND nombre like '%${nombre}%'
                        AND mtro.id_trabajador like '%${id_trabajador}%'
                        AND hist.qna_pago like '%${qna_pago}%'

                    order by hist.id_nom_apagar `

       // console.log(query)

        const pool = await dbConnection()
        const result = await pool.request().query(query)
        console.log('Nomina Detalle Pagada Obtenida')

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
                        id_nom_liq_hist
                        ,hist.id_nom_apagar
                        ,mtro.id_trabajador
                        ,curp
                        ,(paterno+' '+isnull(materno,'')+' '+ nombre) as nombre
                        ,percepcion,deduccion
                        ,liquido
                        ,banco
                        ,isnull(no_cuenta,'') as no_cuenta
                        ,isnull(cve_beneficiario,'') as cve_beneficiario
                        ,isnull(contrato_enlace,'') as contrato_enlace
                        ,hist.qna_pago
                        ,RTRIM(nomina) as nomina
                        ,tipo_pago
                        ,hist.fecha_alta
                    FROM Nominas_Liquido_Hist hist
                        inner join Nominas_APagar apagar on apagar.id_nom_apagar = hist.id_nom_apagar
                        inner join Mtro_Nominas mnom on mnom.id_nom_mtro = apagar.id_nom_mtro
                        inner join Maestro mtro on mtro.id_trabajador = mnom.id_trabajador
                    WHERE
                            hist.id_nom_apagar like '${id_nom_apagar}%'
                            AND id_seccion like '%${seccion}%'
                            AND nomina like '%${nomina}%'
                            AND tipo_pago like '%${id_tipo_pago}%'
                            AND curp like '%${curp}%'
                            AND paterno like '${paterno}%'
                            AND isnull(materno,'') like '${materno}%'
                            AND nombre like '%${nombre}%'
                            AND mtro.id_trabajador like '%${id_trabajador}%'
                            AND hist.qna_pago like '%${qna_pago}%'   
                    order by hist.qna_pago, curp
                    `

        //console.log(query)

        const pool = await dbConnection()
        const result = await pool.request().query(query)
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
                                pagare,
                                usuario,
                                fecha_alta
                            )
                            VALUES (
                                '${qna_pago}'
                                '${id_tipo_nomina}',
                                '${seccion}',
                                'nopagar',
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
                                pagare,
                                usuario,
                                fecha_alta
                            )
                            VALUES (
                                '${qna_pago}'
                                '${id_nom_mtro}',
                                'nopagar',
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

module.exports = {
    obtenNomApagar,
    obtenNomDetallePagado,
    obtenLiquidoPagado,
    excluirSeccionPOST,
    excluirMaestroPost
}