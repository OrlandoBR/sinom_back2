const { Router } = require('express')
const { maestroGet, maestroPost, maestroPut } = require('../controllers/maestros.controller')

const router = Router()

//Obtener datos
router.get('/', maestroGet)
//Insertar Datos
router.post('/', maestroPost)
//Actualizar Datos
router.put('/:id', maestroPut)


module.exports = router
