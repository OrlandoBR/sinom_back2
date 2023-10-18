const { Router } = require('express')
const { query } = require('express-validator')

const { obtenNomApagar,obtenNomDetallePagado, obtenLiquidoPagado
        ,excluirGet,excluirPost,excluirPut
        ,crearNomina,actualizarNomina,consultarEstatusNomina
        ,calcularNomina,obtenDetallePagadoMaestro
            } = require('../controllers/nominas.controller')
//const {validarCampos} = require('../middlewares/validar-campos')

const { } = require('../helpers/validadores')

const router = Router()


router.get('/nomina/apagar',obtenNomApagar)

router.get('/nomina/pagadodet/',obtenNomDetallePagado)

router.get('/nomina/pagadodetmaestro/',obtenDetallePagadoMaestro)


router.get('/nomina/liquido/',obtenLiquidoPagado)

router.get('/nomina/excluidos',excluirGet)

router.post('/nomina/excluidos',excluirPost)

router.put('/nomina/excluidos',excluirPut)

router.post('/nomina/nominactiva',crearNomina)

router.put('/nomina/nominactiva',actualizarNomina)

router.get('/nomina/nominactiva',consultarEstatusNomina)

router.post('/nomina/calcular',calcularNomina) 

/*
router.get('/nomina/quincenactiva', obtenQuincenaActiva) 
router.post('/nomina/quincenactiva', creaQuincenaActiva) 
router.put('/nomina/quincenactiva', cierraQuincenaActiva) 
*/


module.exports = router