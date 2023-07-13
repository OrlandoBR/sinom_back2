const { Router } = require('express')
const { query } = require('express-validator')

const { obtenNomApagar,obtenNomDetallePagado, obtenLiquidoPagado } = require('../controllers/nominas.controller')
//const {validarCampos} = require('../middlewares/validar-campos')

const { } = require('../helpers/validadores')

const router = Router()


router.get('/nomina/apagar',obtenNomApagar)

router.get('/nomina/pagado/',obtenNomDetallePagado)

router.get('/nomina/liquido/',obtenLiquidoPagado)




module.exports = router