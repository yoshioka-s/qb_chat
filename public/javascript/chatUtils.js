var QB = require('quickblox');
var CREDENTIALS = require('../../../settings/quickblox.js');

/**
* Util class for communiccation with Quickblox
* @param {number} shopID
*/
class ChatUtils {
  constructor(shopId) {
    this._shopId = shopId;
    QB.init(CREDENTIALS.appId, CREDENTIALS.authKey, CREDENTIALS.authSecret);
    QB.createSession(function (err, res) {
      if (err) {
        console.error(err);
        return;
      }
      // this._sessionToken = res.token;
    });
  }

  /**
  * log in or sign up to Quickblox
  * @return {Promise} reject: error object, resolve: user ID
  */
  login() {
    return new Promise(function (resolve, reject) {
      QB.login({login: name, password: password}, function(err, user){
        if (!res) {
          // error
          console.error(err);
          _loginErrors = {password: 'user name or password is wrong.'};
          reject(_loginErrors);
          return;
        }
        // success
        _user = user;
        QB.chat.connect({userId: _user.id, password: password}, function(err, roster) {
          if (err) {
            console.error(err);
            throw err;
          }
          return retrieveDialogs()
          .then(function () {
            resolve();
          });
        });
      });
    });
  }

  /**
  * notify operators via Quickblox
  * @param {number} shop ID
  */
  sendWarning (shopId) {

  }

  /**
  * send message to operators via Quickblox
  * @param {number} shop ID
  */
  sendMessage (shopId) {

  }
}

window.ChatUtils = ChatUtils;
