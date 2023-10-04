const { Router } = require('express')
const { query } = require('express-validator')

const { obtenNomApagar,obtenNomDetallePagado, obtenLiquidoPagado
        ,excluirGet,excluirPost,excluirPut
        ,crearNomina,actualizarNomina,consultarEstatusNomina
        ,calcularNomina 
            } = require('../controllers/nominas.controller')
//const {validarCampos} = require('../middlewares/validar-campos')

const { } = require('../helpers/validadores')

const router = Router()


router.get('/nomina/apagar',obtenNomApagar)

router.get('/nomina/pagadodet/',obtenNomDetallePagado)

router.get('/nomina/liquido/',obtenLiquidoPagado)

router.get('/nomina/excluidos',excluirGet)

router.post('/nomina/excluidos',excluirPost)

router.put('/nomina/excluidos',excluirPut)

router.post('/nomina/crear',crearNomina)

router.put('/nomina/crear',actualizarNomina)

router.get('/nomina/crear',consultarEstatusNomina)

router.post('/nomina/calcular',calcularNomina)


module.exports = router