const express = require('express')
const cors = require('cors')

class Server {

    constructor(){
        this.app = express()
        this.port = process.env.PORT
        this.maestrosPath = '/api/maestros'

        //Middlewares
        this.middlewares()
        //Rutas de mi aplicacion
        this.routes()
    }

    middlewares(){ 
        //CORS
        this.app.use(cors())
        //Lectura y Parseo del Body
        this.app.use(express.json())
        //Directorio publico
        this.app.use(express.static('public'))

    }

    routes(){

        this.app.get('/', (req, res)=> {
            res.sendFile(__dirname+'/public/index.html')
        })
        

        this.app.use(this.maestrosPath, require('../routes/maestros.routes'))


        //Si no cae en ninguna anterior
        this.app.get('*', (req, res)=> {
            res.send('404 | Página no encontrada')
        })
        this.app.post('*', (req, res)=> {
            res.send('404 | Página no encontrada post')
        })
        this.app.put('*', (req, res)=> {
            res.send('404 | Página no encontrada put')
        })
    }

    listen(){
        this.app.listen(this.port,()=>{
            console.log('Servidor corriendo en puerto', this.port )
        })
    } 


}

module.exports = Server;