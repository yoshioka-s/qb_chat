/**
* Util funstions for communication with Quickblox
*/
var QBUtils = require('./utils/QBUtils');
var Cookies = require('cookies-js');
var _ = require('underscore');

var COOKIE_NAME = 'QBName';
var COOKIE_ID = 'QBID';
var COOKIE_SID = 'connect.sid';
var MAX_USERNAME_LENGTH = 40;

function createDialog(shopId) {
  return QBUtils.getUsersByTags(shopId)
  .then(function (operators) {
    console.log(operators);
    var operatorIds = _.map(operators, function (operator) {
      return operator.id;
    });
    var dialogName = shopId + Cookies.get(COOKIE_NAME);
    var data = {
      class_name: 'shop_dialog',
      shopId: shopId,
      customerId: Cookies.get(COOKIE_ID)
    };
    return QBUtils.createDialog(dialogName, operatorIds, data);
  });
}

// get the shop's dialog
function getDialog(shopId) {
  return QBUtils.retrieveDialogs()
  .then(function (dialogs) {
    var shopDialog = _.find(dialogs, function (dialog) {
      // dialog name begins with shop ID
      return dialog.name.indexOf(shopId) === 0;
    });
    if (shopDialog) {
      return QBUtils.joinDialog(shopDialog.xmpp_room_jid)
      .then(function () {
        return shopDialog;
      });
    }
    return createDialog(shopId);
  });
}

window.ChatUtils = {
  autoLogin: function () {
    // check if username is stored in cookie
    var username = Cookies.get(COOKIE_NAME);
    if (username) {
      return QBUtils.signIn(username, username);
    }
    username = Cookies.get(COOKIE_SID).substring(0, MAX_USERNAME_LENGTH);
    return QBUtils.signUp(username, username, 'customer')
    .then(function (user) {
      // save username, user ID in cookie
      Cookies.set(COOKIE_NAME, username);
      Cookies.set(COOKIE_ID, user.id);
      return user;
    });
  },

  forwardMessages: function (shopId, serverMessage, customerMessage) {
    return getDialog(shopId)
    .then(function (dialog) {
      QBUtils.sendMessage(serverMessage, dialog.xmpp_room_jid, null, null, QBUtils.NOTIFICATIONS.server);
      QBUtils.sendMessage(customerMessage, dialog.xmpp_room_jid);
    });

  },

  sendWarning: function (shopId) {
    return getDialog(shopId)
    .then(function (dialog) {
      QBUtils.sendStatus(dialog.xmpp_room_jid, 'warning');
      QBUtils.getUsersByTags(shopId)
      .then(function (operators) {
        _.forEach(operators, function (operator) {
          QBUtils.sendWarning(operator.id);
        });
      });
    });
  },

  sendMessage: function (shopId, message) {
    return getDialog(shopId)
    .then(function (dialog) {
      QBUtils.sendMessage(message, dialog.xmpp_room_jid, null, null, QBUtils.NOTIFICATIONS.customer);
    });
  },

  setOnMessage: function (callback) {
    this._onMessage = callback;
  },
  _onMessage: function (userId, message) {
    console.log(message);
  }
};

QBUtils.setMessageListener(function (userId, message) {
  // on my messages, send urgent status notification
  if (message.extension && message.extension.notification_type == QBUtils.NOTIFICATIONS.customer) {
    console.log('send urgent');
    QBUtils.sendStatus(message.extension.to, 'urgent');
  }
  ChatUtils._onMessage(userId, message);
});
