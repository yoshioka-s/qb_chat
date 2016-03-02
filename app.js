var express = require('express');
var bodyParser = require('body-parser');
var chatController = require('./controllers/chatController.js');

var app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname + '/node_mondules'));
app.use(express.static(__dirname + '/public'));
app.use('/', chatController);


var port = process.env.PORT || 8888;
console.log('Listening on ' + port);
app.listen(port);
