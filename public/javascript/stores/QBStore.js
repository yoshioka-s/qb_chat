var AppDispatcher = require('../dispatcher/AppDispatcher.js');
var QBConstants = require('../constants/QBConstants');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var Promise = require('bluebird').Promise;
var _ = require('underscore');
var QB = require('quickblox');
var CREDENTIALS = require('../../../settings/quickblox.js');
var supportAccount = require('../../../settings/account.js');

var CHANGE_EVENT = 'change';

var _user =  null;
var _uploadedFiles = [];
var _messages = [];
var _opponentId = supportAccount.userId;
var _adminId = supportAccount.userId;
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
/**
* sign up a new user
* @param {string} username
* @param {string} password
* @return {Promise}
*/
function signUp(name, password) {
  console.log({login: name, password: password});
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
      _user = user.id;
      console.log(user);
      resolve(user);
    });
  })
  .then(function (user) {
    QB.chat.connect({userId: _user, password: password}, function(err, roster) {
      if (err) {
        console.error(err);
        throw err;
      }
      console.log('connected', roster);
      sendMessage(name+' signed up!');
      QBStore.emitChange();
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
      console.log(res);
      // _sessionToken = res.token;
      _user = res.id;
      console.log('user', _user);
      resolve(res);
    });
  })
  .then(function () {
    QB.chat.connect({userId: _user, password: password}, function(err, roster) {
      if (err) {
        console.error(err);
        throw err;
      }
      console.log('connected', roster);
      return retrieveDialogs()
      .then(function () {
        QBStore.emitChange();
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
      _opponentId = supportAccount.userId;
      _dialogs = [];
      _sessionToken = '';

      console.log('log out');
      resolve(result);
    });
  });
}

/**
* on signing in, start a new chat
*/
function openChat() {
  console.log({userId: _user});
  $.ajax({
    method: 'get',
    url: '/start',
    data: {userId: _user},
    dataType: 'json'
  })
  .done(function (res) {
    console.log(res);
    _adminId = res.adminId;
  });
}

/**
* @return {array} messages
*/
function onMessage(userId, message) {
  console.log('onMessage',userId, message);
  _messages.push({sender_id: userId, message: message.body, attachments: message.extension.attachments});
  retrieveDialogs()
  .then(function (dialogs) {
    QBStore.emitChange();
  });
}
QB.chat.onMessageListener = onMessage;

/**
* @param {string} message
*/
function sendMessage(message, options) {
  console.log('sendMessage', message, _uploadedFiles);
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
    type: 'chat',
    body: message,
    extension: extension
  };
  var messageObj = {
    sender_id: _user,
    message: message,
    attachments: extension.attachments
  };

  // options
  _.each(options, function (option, i) {
    messageObj['customParam'+i] = option;
    data.extension['customParam'+i] = option;
  });
  QB.chat.send(_opponentId, data);
  console.log('sent message', messageObj);
  _messages.push(messageObj);
  _uploadedFiles = [];
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
        console.log(err);
        reject(err);
        return;
      }
      console.log(response);
      // var uploadedFile = response;
      // var uploadedFileId = response.id;
      _uploadedFiles.push(response);
      resolve(response);
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
    var params = {chat_dialog_id: dialogId, sort_asc: 'date_sent', limit: 50, skip: 0};
    QB.chat.message.list(params, function(err, messages) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      _messages = messages.items;
      console.log('messages get!', messages);
      var selectedDialog = _.find(_dialogs, function (dialog) {
        return dialog._id === dialogId;
      });
      console.log(_dialogs, dialogId, selectedDialog);
      _opponentId = _.find(selectedDialog.occupants_ids, function (userId) {
        return userId !== _user;
      });
      console.log('_opponentId',_opponentId);

      resolve(messages);
    });
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

  /**
   * Get the entire collection of messages.
   * @return {object}
   */
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

  /**
   * @param {function} callback
   */
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  /**
   * @param {function} callback
   */
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
    }

    return true; // No errors. Needed by promise in Dispatcher.
  })

});

module.exports = QBStore;
