const { Router } = require('express')
const { obtenTipoNomina } = require('../controllers/catalogos.controller')
const router = Router()

//Obtener datos
router.get('/catalogo/tiponomina',obtenTipoNomina)

module.exports = router