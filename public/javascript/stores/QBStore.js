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
var _currentDialog = null;
var _opponentId = null;
var _dialogs = [];
var _loginErrors = {username: '', password:''};

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
  });
}

/**
* on message event
* @return {array} messages
*/
function onMessage(userId, message) {
  console.log(message);
  // notification of a new dialog
  if (message.extension && message.extension.notification_type == QBUtils.NOTIFICATIONS.newDialog) {
  }
  // notification of warning dialog
  else if (message.extension && message.extension.notification_type == QBUtils.NOTIFICATIONS.warning) {
    console.log('warning!', message);
  }
  // notification of warning dialog
  else if (message.extension && message.extension.notification_type == QBUtils.NOTIFICATIONS.urgent) {
    console.log('urgent!', message);
  }
  // message from current opponent
  else if (message.dialog_id === _dialogId) {
    console.log('message on current dialog');
    // push to _messages so the message is displayed in chat window
    _messages.push({
      sender_id: userId,
      message: message.body,
      attachments: message.extension.attachments,
      notification_type: message.extension.notification_type
    });
  }
  retrieveDialogs()
  .then(function (dialogs) {
    QBStore.emitChange();
  });
}

QBUtils.setMessageListener(onMessage);

/**
* @param {string} message
* @param {array} options for select (optional)
*/
function sendMessage(message, options) {
  QBUtils.sendMessage(message, _currentDialog.xmpp_room_jid, options, _uploadedFiles);

  var messageObj = {
    sender_id: _user.id,
    message: message,
    attachments: _.map(_uploadedFiles, function (file) {
      return {id: file.id, type: file.content_type, name: file.name};
    })
  };

  _uploadedFiles = [];
}

/**
* upload
* @param {object} file object
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
  return QBUtils.retrieveDialogs()
  .then(function (resDialogs) {
    _dialogs = resDialogs;
    // show the list of dialogs
    return resDialogs;
  });
}

/**
* change showing dialog
* @return {Promise}
*/
function switchDialog(dialogId) {
  _currentDialog = _.find(_dialogs, function (dialog) {
    return dialog._id === dialogId;
  });
  QBUtils.joinDialog(_currentDialog.xmpp_room_jid);
  return QBUtils.retrieveDialogMessages(dialogId)
  .then(function (messages) {
    _dialogId = dialogId;
    // reset uploaded files
    _uploadedFiles = [];
    // ignore sign up notification
    _messages = messages;
    return messages;
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
    console.log(_dialogs);
    return _dialogs;
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
