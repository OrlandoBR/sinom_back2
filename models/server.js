const express = require('express')
const cors = require('cors')
const { sql, dbConnection } = require('../database/config.db')


class Server {



    constructor(){
        this.app = express()
        this.port = process.env.PORT
        this.apiPath = '/api/'

         //Crear conexion Base de Datos
        this.conectarDB()
        //Middlewares
        this.middlewares()
        //Rutas de mi aplicacion
        this.routes()
    }

    async conectarDB(){
        await dbConnection()
    }

    middlewares(){ 
            // Configurar CORS para permitir solicitudes desde tu aplicación Vue.js (ajusta los orígenes permitidos según sea necesario)
            let corsOptions = {
                origin: 'http://10.0.1.51:8081/', // Cambia esto a la URL de tu aplicación Vue.js
                optionsSuccessStatus: 200,
            };
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
        

        this.app.use(this.apiPath, require('../routes/maestros.routes'))
        this.app.use(this.apiPath, require('../routes/mtro_nomina.routes'))
        this.app.use(this.apiPath, require('../routes/nominas.routes'))
        this.app.use(this.apiPath, require('../routes/usuario.routes'))
        this.app.use(this.apiPath, require('../routes/catalogos.routes'))


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