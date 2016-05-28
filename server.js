var express  = require('express');
var app      = express();                               

app.use(express.static(__dirname + '/public'));                 

var port = process.env.PORT ? process.env.PORT : 8080;
app.listen(port);

app.get('*', function(req, res) {
    res.sendfile('./public/index.html');
});

