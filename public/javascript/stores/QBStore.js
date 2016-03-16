var AppDispatcher = require('../dispatcher/AppDispatcher.js');
var QBConstants = require('../constants/QBConstants');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var Promise = require('bluebird').Promise;
var _ = require('underscore');
var QB = require('quickblox');
var CREDENTIALS = require('../../../settings/quickblox.js');

var CHANGE_EVENT = 'change';

var _user =  null;
var _uploadedFiles = [];
var _messages = [];
var _dialogId = null;
var _adminIds = null;
var _dialogs = [];
var _sessionToken = '';
var _loginErrors = '';

QB.init(CREDENTIALS.appId, CREDENTIALS.authKey, CREDENTIALS.authSecret);
QB.createSession(function (err, res) {
  if (err) {
    console.error(err);
    return;
  }
  _sessionToken = res.token;
});

function setAdmin(adminIds) {
  _adminIds = adminIds;
}

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
        _loginErrors = parseError(err);
        reject('signup');
        return;
      }
      // success
      console.log('sign up!', user);
      // sign in
      signIn(name, password)
      .then(function () {
        return createDialog();
      })
      .then(function () {
        resolve();
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
    QB.login({login: name, password: password}, function(err, res){
      if (!res) {
        // error
        console.error(err);
        _loginErrors = {password: 'user name or password is wrong.'};
        reject('login');
        return;
      }
      // success
      _user = res;
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
      // success
      _user =  null;
      _uploadedFiles = [];
      _messages = [];
      _dialogId = null;
      _dialogs = [];
      _sessionToken = '';

      resolve(result);
    });
  });
}

QB.chat.onMessageListener = onMessage;
/**
* on message event
* @return {array} messages
*/
function onMessage(userId, message) {
  console.log(message);
  // On notification of a new dialog
  if (message.extension && message.extension.notification_type === '1') {
    console.log('new dialog');
  }
  // On message from current opponent
  if (message.dialog_id === _dialogId) {
    console.log('message on current dialog');
    // push to _messages to display in chat window
    _messages.push({sender_id: userId, message: message.body, attachments: message.extension.attachments});
  }
  retrieveDialogs()
  .then(function (dialogs) {
    QBStore.emitChange();
  });
}

function updateMainOperator(dialogId, operatorId) {
  var updateParams = {
    data: {
      class_name: 'product_dialog',
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
* @param {string} message
*/
function sendMessage(message, options) {
  var extension = {
    save_to_history: 1
  };

  // file attaching
  if (_uploadedFiles.length > 0) {
    extension.attachments = _uploadedFiles.map(function (file) {
      return {id: file.id, type: file.content_type, name: file.name};
    });
  }

  var data = {
    type: 'groupchat',
    body: message,
    extension: extension
  };
  var messageObj = {
    sender_id: _user.id,
    message: message,
    attachments: extension.attachments
  };

  // options
  _.each(options, function (option, i) {
    messageObj['customParam'+i] = option;
    data.extension['customParam'+i] = option;
  });
  // send
  console.log(_dialogId);
  QB.chat.send(_dialogId, data);
  _messages.push(messageObj);
  _uploadedFiles = [];

  var currentDialog = _.find(_dialogs, function (dialog) {
    return dialog._id === _dialogId;
  });
  // if the dialog doesn't have main operator and currentUser is not operator
  if (!currentDialog.data.main_operator && _adminIds.indexOf(_user.id)) {
    // update main_operator
    updateMainOperator(_dialogId, _user.id);
  }
}

/**
* upload
* @return {Promise}
*/
function uploadFile(inputFile) {
  return new Promise(function (resolve, reject) {
    var params = {name: inputFile.name, file: inputFile, type: inputFile.type, size: inputFile.size, 'public': false};
    QB.content.createAndUpload(params, function (err, response) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      _uploadedFiles.push(response);
      resolve(response);
    });
  });
}

/**
* create new dialog with operators on user signUp
* @return {Promise}
*/
function createDialog() {
  return new Promise(function (resolve, reject) {
    var params = {
      type: 2,
      occupants_ids: _adminIds,
      name: _user.login,
      user: _user.id,
      data: {
        class_name: 'product_dialog',
        main_operator: 0
      }
    };
    QB.chat.dialog.create(params, function (err, newDialog) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      console.log(newDialog);
      _dialogs.push(newDialog);
      _dialogId = newDialog._id;
      // send notification to operators
      var msg = {
        type: 'chat',
        extension: {
          notification_type: 1,
          _id: _dialogId
        }
      };
      QB.chat.send(_dialogId, msg);
      switchDialog(_dialogId)
      .then(function () {
        resolve();
      });
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
      _dialogs = resDialogs.items;
      if (_dialogs.length === 1) {
        switchDialog(_dialogs[0]._id)
        .then(function () {
          resolve(resDialogs);
        });
      } else {
        resolve(resDialogs);
      }
    });
  });
}

/**
* set customer
* @return {Promise}
*/
function switchDialog(dialogId) {
  return new Promise(function (resolve, reject) {
    // QB.chat.muc.join(dialogId, function(resultStanza) {
    //   console.log(resultStanza);
    //   // console.log(err);
    //   var joined = !_.any(resultStanza.childNodes, function (elItem) {
    //     return elItem.tagName === 'error';
    //   });
    //   if (!joined) {
    //     reject();
    //     return;
    //   }
      // get the list of dialogs
      var params = {chat_dialog_id: dialogId, sort_asc: 'date_sent', limit: 50, skip: 0};
      QB.chat.message.list(params, function(err, messages) {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }

        // reset uploaded files
        _uploadedFiles = [];

        _messages = messages.items;

        // change chatting dialog
        _dialogId = dialogId;

        resolve(messages);
      });
    // });

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

var QBStore = assign({}, EventEmitter.prototype, {
  getMessages: function() {
    return _messages;
  },

  getUser: function () {
    return _user;
  },

  getUploadedFiles: function () {
    return _uploadedFiles;
  },

  getDialogs: function () {
    return _dialogs;
  },

  getSessionToken: function () {
    return _sessionToken;
  },

  getLoginErrors: function () {
    return _loginErrors;
  },

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

  dispatcherIndex: AppDispatcher.register(function(payload) {
    var action = payload.action;

    switch(action.actionType) {
      case QBConstants.SIGN_UP:
        signUp(action.name, action.password)
        .then(function () {
          QBStore.emitChange();
        })
        .catch(function (err) {
          QBStore.emitChange();
          throw err;
        });
        break;

      case QBConstants.SIGN_IN:
        signIn(action.name, action.password)
        .then(function () {
          QBStore.emitChange();
        })
        .catch(function (err) {
          QBStore.emitChange();
          throw err;
        });
        break;

      case QBConstants.SIGN_OUT:
        signOut()
        .then(function () {
          QBStore.emitChange();
        });
        break;

      case QBConstants.SEND:
        sendMessage(action.message, action.options);
        QBStore.emitChange();
        break;

      case QBConstants.UPLOAD:
        uploadFile(action.inputFile)
        .then(function () {
          QBStore.emitChange();
        });
        break;

      case QBConstants.SWITCH:
        switchDialog(action.dialogId)
        .then(function () {
          QBStore.emitChange();
        });
        break;

      case QBConstants.SET_ADMIN:
        setAdmin(action.adminIds);
        break;
    }

    return true; // No errors. Needed by promise in Dispatcher.
  })

});

module.exports = QBStore;
