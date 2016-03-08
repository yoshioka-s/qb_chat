var express = require('express');
// var QB = require('quickblox');
var Promise = require('bluebird').Promise;
// var CREDENTIALS = require('./../settings/quickblox.js');
var supportAccount = require('./../settings/account.js');
var router = express.Router();

var customers = [];

router.get('/start', function(req, res) {

  var userId = req.query.userId;

  console.log('openChat');
  console.log(userId);
  // save the customer
  customers.push(userId);
  var opponentId = (userId==supportAccount.userId ? 10547951:supportAccount.userId);
  res.json({opponentId: opponentId});
});

router.get('/customers', function (req, res) {
  var userId = req.query.userId;

  if (userId != supportAccount.userId) {
    res.status(e.status || 403);
    res.json('you are not authorized to get customers list');
    return;
  }

  res.json(customers);
});

module.exports = router;
