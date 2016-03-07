var express = require('express');
// var QB = require('quickblox');
var Promise = require('bluebird').Promise;
// var CREDENTIALS = require('./../settings/quickblox.js');
var supportAccount = require('./../settings/account.js');
var router = express.Router();

// QB.init(CREDENTIALS.appId, CREDENTIALS.authKey, CREDENTIALS.authSecret);
// new Promise(function (resolve, reject) {
//   QB.createSession({login: supportAccount.name, password: supportAccount.password}, function(err, res){
//     if (!res) {
//       // error
//       console.error(err);
//       reject(err);
//       return;
//     }
//     // success
//     console.log('session created');
//     console.log(res);
//     resolve(res);
//   });
// })
// .then(function (res) {
//   QB.chat.connect({userId: supportAccount.userId, password: supportAccount.password}, function(err, roster) {
//     if (err) {
//       console.error(err);
//       reject(err);
//       return;
//     }
//     console.log('connected', roster);
//     return roster;
//   });
// })
// .catch(function (err) {
//   console.error(err);
// });

router.get('/start', function(req,res) {

  var userId = req.query.userId;
  // create chat session with the client

  console.log('openChat');

  // QB.chat.send(userId, {
  //   type: 'chat',
  //   body: 'first message',
  //   extension: {
  //     save_to_history: 1,
  //   }
  // });
  // console.log('opened');
  console.log(userId);
  var opponentId = (userId==supportAccount.userId ? 10547951:supportAccount.userId);
  res.json({opponentId: opponentId});
});

module.exports = router;
