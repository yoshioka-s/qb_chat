var Promise = require('bluebird').Promise;
var _ = require('underscore');
var QB = require('quickblox');
var CREDENTIALS = require('../../../settings/quickblox.js');

QB.init(CREDENTIALS.appId, CREDENTIALS.authKey, CREDENTIALS.authSecret, CREDENTIALS.config);
QB.createSession(function (err, res) {
  if (err) {
    console.error(err);
    return;
  }
});

/**
* sign up a new user
* @param {string} username
* @param {string} password
* @return {Promise}
*/
function signUp(name, password) {
  return new Promise(function (resolve, reject) {
    QB.users.create({login: name, password: password}, function(err, user){
      if (!user) {
        // error
        console.error(err);
        reject(parseError(err));
        return;
      }
      // success
      // sign in
      signIn(name, password)
      .then(function () {
        resolve(user);
      });
    });
  });
}

/**
* log in with an existing user
* @param {string} username
* @param {string} password
* @return {Promise}
*/
function signIn(name, password) {
  return new Promise(function (resolve, reject) {
    QB.login({login: name, password: password}, function(err, user){
      if (!user) {
        // error
        console.error(err);
        reject({password: 'user name or password is wrong.'});
        return;
      }
      // success
      QB.chat.connect({userId: user.id, password: password}, function(err, roster) {
        if (err) {
          console.error(err);
          throw err;
        }
        // TODO: get list of users and set this._operatorIds using this.shopId
        resolve(user);
      });
    });
  });
}

/**
* sign out
* @return {Promise}
*/
function signOut() {
  return new Promise(function (resolve, reject) {
    QB.logout(function(err, result){
      if (err) {
        // error
        console.error(err);
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

/**
* set on message event listener
* @param {function} callback on message event
*/
function setMessageListener(messageListener) {
  QB.chat.onMessageListener = messageListener;
}

/**
* @param {string} message
* @param {string} to
* @param {array} options (optional)
* @param {array} files (optional)
*/
function sendMessage(message, to, options, files) {
  console.log('sendMessage to: ', to);
  var extension = {
    save_to_history: 1
  };

  // file attaching
  extension.attachments = _.map(files, function (file) {
    return {id: file.id, type: file.content_type, name: file.name};
  });

  var data = {
    type: 'groupchat',
    body: message,
    extension: extension
  };

  // options
  _.each(options, function (option, i) {
    messageObj['customParam'+i] = option;
    data.extension['customParam'+i] = option;
  });

  // send
  return QB.chat.send(to, data); // TODO send to group chat
  // QB.chat.send(_dialogId, data);  // THIS DOES NOT WORK
  // QB.chat.send(_adminIds[0], data); // THIS WORKS
}

/**
* upload
* @return {Promise}
*/
function uploadFile(inputFile) {
  return new Promise(function (resolve, reject) {
    var params = {name: inputFile.name, file: inputFile, type: inputFile.type, size: inputFile.size, 'public': false};
    QB.content.createAndUpload(params, function (err, uploadedFile) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      resolve(uploadedFile);
    });
  });
}

/**
* create new dialog with operators on user signUp
* @param {string} name of the dialog
* @param {array} occupantIds
* @return {Promise}
*/
function createDialog(name, occupantIds) {
  return new Promise(function (resolve, reject) {
    var params = {
      type: 2,
      occupants_ids: occupantIds,
      name: name,
      data: {
        class_name: 'shop_dialog',
        shopId: self.shopId,
        main_operator: 0
      }
    };
    // create a group chat dialog
    QB.chat.dialog.create(params, function (err, newDialog) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      console.log(newDialog);
      // send notification to occupants
      var msg = {
        type: 'chat',
        extension: {
          save_to_history: 1,
          notification_type: 1,  // new customer notification
          _id: newDialog._id
        }
      };
      // send to every occupants
      _.each(occupantIds, function (occupantId) {
        QB.chat.send(occupantId, msg);
      });

      // join to the new dialog
      joinDialog(newDialog.xmpp_room_jid)
      .then(function (dialogId) {
        console.log('joined', dialogId);
        resolve(newDialog);
      });
    });
  });
}

/**
* join dialog
* @param {number} id of the dialog
* @return {Promise}
*/
function joinDialog(dialogId) {
  return new Promise(function (resolve, reject) {
    QB.chat.muc.join(dialogId, function(resultStanza) {
      var joined = _.every(resultStanza.childNodes, function (item) {
        return item.tagName !== 'error';
      });
      if (joined) {
        sendMessage('created', dialogId);
        resolve(dialogId);
      } else {
        reject();
      }
    });
  });
}

/**
* retrieve dialogs
* @return {Promise}
*/
function retrieveDialogs() {
  return new Promise(function (resolve, reject) {
    QB.chat.dialog.list(null, function(err, resDialogs) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      console.log(resDialogs);
      resolve(resDialogs);
    });
  });
}

/**
* set customer
* @return {Promise}
*/
function retrieveDialogMessages(dialogId) {
  console.log('retrieveDialogMessages: ', dialogId);
  return new Promise(function (resolve, reject) {
    // get the list of messages
    var params = {chat_dialog_id: dialogId, sort_asc: 'date_sent', limit: 50, skip: 0};
    QB.chat.message.list(params, function(err, messages) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }

      // TODO remove this logic after enabling group chat
      // var currentDialog = _.find(_dialogs, function (dialog) {
      //   return dialog._id === dialogId;
      // });
      // _opponentId = _.find(currentDialog.occupants_ids, function (occupants_id) {
      //   return occupants_id !== _user.id;
      // });

      resolve(messages);
    });

  });
}

/**
* update main operator attribute of a dialog
* @return {array} messages
*/
function updateMainOperator(dialogId, operatorId) {
  var updateParams = {
    data: {
      class_name: 'shop_dialog',
      main_operator: operatorId
    }
  };
  QB.chat.dialog.update(dialogId, updateParams, function(err, res) {
    if (err) {
      console.error(err);
      return;
    }
    console.log(res);
  });
}

/**
* @param {object} error response from QB
* @return {array} error messages which users can understand
*/
function parseError(err) {
  var result = {};
  detail = JSON.parse(err.detail);
  _.each(detail.errors, function (reasons, field) {
    // fix field name
    if (field === 'login') {
      field = 'username';
    }
    // concat error messages
    result[field] = _.reduce(reasons, function (memo, reason) {
      return memo + field + ' ' + reason + '. ';
    }, ' ');
  });

  return result;
}

module.exports = {
  signUp: signUp,
  signIn: signIn,
  signOut: signOut,
  sendMessage: sendMessage,
  setMessageListener: setMessageListener,
  uploadFile: uploadFile,
  createDialog: createDialog,
  joinDialog: joinDialog,
  retrieveDialogs: retrieveDialogs,
  retrieveDialogMessages: retrieveDialogMessages,
  updateMainOperator: updateMainOperator
};
