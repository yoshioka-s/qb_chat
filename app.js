var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var chatController = require('./controlleres/chatController.js');

var app = express();
app.use(express.static('client'));
app.use(bodyParser.json());

app.use('/', chatController);


var port = process.env.PORT || 8888;
console.log('Listening on ' + port);
app.listen(port);
