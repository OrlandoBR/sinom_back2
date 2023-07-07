const { Router } = require('express')
const { check } = require('express-validator')

const { maestroGet, maestroPost, maestroPut } = require('../controllers/maestros.controller')

const {validarCampos} = require('../middlewares/validar-campos')
const {esUsuarioValido,id_trabajadorValido} = require('../helpers/validadores')

const router = Router()

//Obtener datos
router.get('/', maestroGet)
//Insertar Datos
router.post('/',[
    check('id_trabajador','El id_trabajdor es obligatorio','elOTRO').not().isEmpty(),
    check('id_trabajador','El id_trabajador debe ser de 7 digitos').isLength({min:7,max:7}),
    check('id_trabajador').custom(id_trabajadorValido),
    check('curp','El CURP es obligatorio').not().isEmpty(),
    check('curp','El CURP debe ser de 18 digitos').isLength({min:18,max:18}),
    check('paterno','El nombre paterno es obligatorio').not().isEmpty(),
    check('materno','El nombre materno es obligatorio').not().isEmpty(),
    check('nombre','El nombre es obligatorio').not().isEmpty(),
    check('seccion','La seccion es obligatorio').not().isEmpty(),
    check('seccion','La seccion excede los caracteres permitidos').isLength({max:2}),
    check('qna_ing_snte','La qna ingreso es obligatorio').not().isEmpty(),
    check('qna_ing_snte','La qna ingreso deben ser numeros').isInt(),
    check('qna_ing_snte','La qna ingreso deben ser 6 digitos').isLength({min:6,max:6}),
    check('telefono','El telefono es obligatorio').not().isEmpty(),
    check('telefono','El telefono debe ser numeros').isInt(),
    check('telefono','El telefono debe ser de 10 digitos').isLength(10),
    check('correo','El correo no es valido').isEmail(),
    check('usuario','Debe incluir el usuario del sistema en la peticion').not().isEmpty(),
    check('usuario').custom((usuario)=> esUsuarioValido(usuario) ),
    validarCampos
], maestroPost)
//Actualizar Datos
router.put('/:id', maestroPut)

module.exports = router