//const { response } = require('express')

const maestroGet = (req, res)=> {
    //Obtiene los parametros que vienen en la URL ?
    const query = req.query

    const body = req.body;
    res.json({
      msg:'get API - controlador',
      query,
      body
    })
}

const maestroPost = (req, res)=> {
    
    const body = req.body;

    res.status(202).json({
    msg:'post API - controlador',
    body
    })
   
}

const maestroPut = (req, res)=> {

    const {id} = req.params
    res.json({
        msg:'put API - controlador',
        id
    })
}

module.exports = {
    maestroGet,
    maestroPost,
    maestroPut
}