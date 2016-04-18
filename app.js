var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var chatController = require('./controllers/chatController.js');

var app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'))
.use(cookieParser());
app.use(session({
  cookie: { path: '/', httpOnly: false, secure: false, maxAge: null },
  secret: 'chat'
}));
app.use('/', chatController);

// route for creating session
app.get('/session', function(req, res, next) {
  req.session.views = 1;
  req.session.save();
  res.json(req.session);
  res.end();
});

var port = process.env.PORT || 8888;
console.log('Listening on ' + port);
app.listen(port);
