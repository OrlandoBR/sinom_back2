const { Router} = require('express')

const { usuarioGet } = require('../controllers/usuario.controller')

const router = Router()

router.get('/usuario/', usuarioGet)

module.exports = router