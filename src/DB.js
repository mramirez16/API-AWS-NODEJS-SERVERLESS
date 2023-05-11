
const { error } = require('console');
const mongoose = require('mongoose');

const URL = "mongodb+srv://mramirez16dev:XAB1LyZM8ZSZ3vFr@cluster0.f12wxs6.mongodb.net/tiendita?retryWrites=true&w=majority";

//configuracion mongoose
mongoose.Promise = global.Promise;
mongoose.set('strictQuery', false);
mongoose.connect(URL, { useUnifiedTopology: true })
const db = mongoose.connection;

db.once('open', function (){
    console.log('DB Start');
})

db.on('error', function (){
    console.log(`Error en la conexión a BD:: ${error}`);
});

const closeConnection = function (){
    db.close(function(){
        console.log(`DB Close`);
    });
}

module.exports = {
    closeConnection,
    db
}