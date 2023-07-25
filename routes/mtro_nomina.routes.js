const { Router } = require('express')
const { check,body, param } = require('express-validator')

const { mtroNominaGet,mtroNominaPost,mtroNominaPut } = require('../controllers/mtro_nomina.controller')
const {validarCampos} = require('../middlewares/validar-campos')

const { validaId_trabajadorExiste, validaRepeticionTipoNomina,validaFechasValidas} = require('../helpers/validadores')

const router = Router()

//Insertar Datos
router.post('/mtronomina',[
    body('id_trabajador').notEmpty().withMessage('No mames y que maestro es ?')
        .isLength({min:7,max:7}).withMessage('Longitud debe ser de 7 digitos')
        .bail()
        .custom((id_trabajador)=> validaId_trabajadorExiste(id_trabajador) ),
    body('id_tipo_nomina')
        .notEmpty().withMessage('Y de que nomina ?')
        .bail()
        .isIn(['1','2','3']).withMessage('El tipo de nomina no existe')
        .bail()
        .custom((value, {req})=>validaRepeticionTipoNomina(value,req)),
    body('qna_desde')
        .notEmpty().withMessage('Y desde cuando o que ?')
        .bail()
        .isLength({min:6,max:6}).withMessage('Longitud debe ser de 6 digitos')
        .bail()
        .isInt().withMessage('Debe ser un valor numerico'),
    body('qna_hasta')
        .notEmpty().withMessage('Hasta cuando le daremos su dinerito ?')
        .bail() //Si no cumple anterior, cancela las validaciones siguientes.
        .isLength({min:6,max:6}).withMessage('Longitud debe ser de 6 digitos')
        .isInt().withMessage('Debe ser un valor numerico'),
        //.bail()
        //.custom( (value,{req})=>validaFechasValidas(value,req) ),
    body('usuario')
        .notEmpty().withMessage('Y quien se hara responsable ?'),
    body('cargo')
        .optional()
        .isLength({max:80}).withMessage('El cargo supera los 80 caracteres'),
    validarCampos
],mtroNominaPost)

//Actualizar Datos
router.put('/mtronomina/:id',[
    param('id')
        .notEmpty().withMessage('Es necesario ingresar el ID del registro a actualizar'),
    /*body('qna_desde')
        .notEmpty().withMessage('Y desde cuando o que ?')
        .bail()
        .isLength({min:6,max:6}).withMessage('Longitud debe ser de 6 digitos')
        .bail()
        .isInt().withMessage('Debe ser un valor numerico'),*/
    body('qna_hasta')
        .notEmpty().withMessage('Hasta cuando le daremos su dinerito ?')
        .bail() //Si no cumple anterior, cancela las validaciones siguientes.
        .isLength({min:6,max:6}).withMessage('Longitud debe ser de 6 digitos')
        .isInt().withMessage('Debe ser un valor numerico'),
        //.bail()
        //.custom( (value,{req})=>validaFechasValidas(value,req) ), // No se porque da porblemas con 202315
    body('usuario')
        .notEmpty().withMessage('Y quien se hara responsable ?'),
    body('cargo')
        .optional()
        .isLength({max:80}).withMessage('El cargo supera los 80 caracteres'),
    validarCampos
],mtroNominaPut)

//Obtener datos
router.get('/mtronomina',mtroNominaGet)


module.exports = router