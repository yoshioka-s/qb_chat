var AppDispatcher = require('../dispatcher/AppDispatcher.js');
var QBConstants = require('../constants/QBConstants');
var QBUtils = require('../utils/QBUtils');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var Promise = require('bluebird').Promise;
var _ = require('underscore');

const CHANGE_EVENT = 'change';

var _user =  null;
var _uploadedFiles = [];
var _messages = [];
var _dialogId = null;
var _opponentId = null;
var _adminIds = null;
var _dialogs = [];
var _sessionToken = '';
var _loginErrors = '';


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
  _loginErrors = {};
  return QBUtils.signUp(name, password)
  .catch(function (error) {
    _loginErrors = error;
    throw error;
  })
  .then(function (user) {
    _user = user;
    console.log(user);
    return QBUtils.createDialog(user.login, _adminIds);
  })
  .then(function (newDialog) {
    _dialogs.push(newDialog);
    _dialogId = newDialog.dialogId;
    return retrieveDialogs();
  });
}

/**
* log in with an existing user
* @param {string} username
* @param {string} password
* @return {Promise}
*/
function signIn(name, password) {
  _loginErrors = {};
  return QBUtils.signIn(name, password)
  .then(function (user) {
    console.log('test ok');
    _user = user;
    return retrieveDialogs();
  })
  .catch(function (error) {
    _loginErrors = error;
    throw error;
  });
}

/**
* sign out
* @return {Promise}
*/
function signOut() {
  return QBUtils.signOut()
  .then(function () {
    _user =  null;
    _uploadedFiles = [];
    _messages = [];
    _dialogId = null;
    _dialogs = [];
    _sessionToken = '';
  });
}

/**
* on message event
* @return {array} messages
*/
function onMessage(userId, message) {
  console.log(message);
  // On notification of a new dialog
  if (message.extension && message.extension.notification_type === '1') {
    console.log('new dialog');
    QBUtils.joinDialog(message.extension._id);
    // do not push to _messages
  }
  // On message from current opponent
  if (message.dialog_id === _dialogId) {
    console.log('message on current dialog');
    // push to _messages so the message is displayed in chat window
    _messages.push({sender_id: userId, message: message.body, attachments: message.extension.attachments});
  }
  retrieveDialogs()
  .then(function (dialogs) {
    QBStore.emitChange();
  });
}

QBUtils.setMessageListener(onMessage);

/**
* @param {string} message
*/
function sendMessage(message, options) {
  var isMessgeSent = QBUtils.sendMessage(message, _dialogId, options, _uploadedFiles);
  console.log('message sent: ', isMessgeSent);

  var messageObj = {
    sender_id: _user.id,
    message: message,
    attachments: _.map(_uploadedFiles, function (file) {
      return {id: file.id, type: file.content_type, name: file.name};
    })
  };
  _messages.push(messageObj);

  _uploadedFiles = [];

  var currentDialog = _.find(_dialogs, function (dialog) {
    return dialog._id === _dialogId;
  });
  // TODO: if the dialog doesn't have main operator and currentUser is not operator
  // if (!currentDialog.data.main_operator && _adminIds.indexOf(_user.id)) {
  //   // update main_operator
  //   updateMainOperator(_dialogId, _user.id);
  // }
}

/**
* upload
* @return {Promise}
*/
function uploadFile(inputFile) {
  return QBUtils.uploadFile(inputFile)
  .then(function (uploadedFile) {
    _uploadedFiles.push(uploadedFile);
    return uploadedFile;
  });
}

/**
* retrieve dialogs
* @return {Promise}
*/
function retrieveDialogs() {
  var promise = QBUtils.retrieveDialogs();
  return promise
  .then(function (resDialogs) {
    _dialogs = resDialogs.items;
    // if currentUser is operator, show list of dialogs
    if (_dialogs.length > 1) {
      return resDialogs;
    }
    // if currentUser is customer, automatically select a dialog
    return switchDialog(_dialogs[0]._id)
    .then(function () {
      return resDialogs;
    });
  });
}

/**
* change showing dialog
* @return {Promise}
*/
function switchDialog(dialogId) {
  return QBUtils.retrieveDialogMessages(dialogId)
  .then(function (messages) {
    _dialogId = dialogId;
    // reset uploaded files
    _uploadedFiles = [];
    // ignore sign up notification
    _messages = _.filter(messages.items, function (item) {
      return item.notification_type !== '1';
    });
    return messages;
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
          // throw err;
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
