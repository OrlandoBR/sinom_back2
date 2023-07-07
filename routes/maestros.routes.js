const { Router } = require('express')
const { check } = require('express-validator')

const { maestroGet, maestroPost, maestroPut } = require('../controllers/maestros.controller')

const {validarCampos} = require('../middlewares/validar-campos')

const router = Router()

//Obtener datos
router.get('/', maestroGet)
//Insertar Datos
router.post('/',[
    check('curp','El CURP es obligatorio').not().isEmpty(),
    check('paterno','El nombre paterno es obligatorio').not().isEmpty(),
    check('materno','El nombre materno es obligatorio').not().isEmpty(),
    check('nombre','El nombre es obligatorio').not().isEmpty(),
    check('seccion','La seccion es obligatorio').not().isEmpty().isLength({max:2}),
    check('qna_ing_snte','La qna ingreso es obligatorio').not().isEmpty(),
    check('telefono','El telefono es obligatorio').not().isEmpty(),
    check('correo','El correo es obligatorio').isEmail(),
    check('domicilio','El domicilio es obligatorio').not().isEmpty(),
    check('municipio','El municipio es obligatorio').not().isEmpty(),
    validarCampos
], maestroPost)
//Actualizar Datos
router.put('/:id', maestroPut)


module.exports = router
