var express = require('express');
const app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(require(__dirname+'/routes/routes'));


const PORT =  process.env.PORT|| 8081;

var server = app.listen(PORT, function(){

    var host = server.address().address
    var port = server.address().port

    console.log("Server Running at %s:%s",host,port)
    });
