var AppDispatcher = require('../dispatcher/AppDispatcher.js');
var QBConstants = require('../constants/QBConstants');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var Promise = require('bluebird').Promise;
var QB = require('quickblox');
var CREDENTIALS = require('../../../settings/quickblox.js');

var CHANGE_EVENT = 'change';

QB.init(CREDENTIALS.appId, CREDENTIALS.authKey, CREDENTIALS.authSecret);
QB.createSession(function(err, result) {
  // callback function
});

var _user =  null;
var _messages = [];
var _opponentId = '';

/**
* sign up a new user
* @param {string} username
* @param {string} password
* @return {Promise}
*/
function signUp(name, password) {
  console.log({login: name, password: password});
  return new Promise(function (resolve, rejecct) {
    QB.users.create({login: name, password: password}, function(err, user){
      if (!user) {
        // error
        console.error(err);
        rejecct(err);
      }
      // success
      _user = user;
      console.log(user);
      resolve(user);
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
  return new Promise(function (resolve, rejecct) {
    QB.login({login: name, password: password}, function(err, user){
      if (!user) {
        // error
        console.error(err);
        rejecct(err);
      }
      // success
      _user = user;
      console.log(user);
      resolve(user);
    });
  });
}

/**
* sign out
* @return {Promise}
*/
function signOut() {
  return new Promise(function (resolve, rejecct) {
    QB.logout(function(err, result){
      if (err) {
        // error
        console.error(err);
        rejecct(err);
      }
      // success
      _user = null;
      console.log('log out');
      resolve(result);
    });
  });
}

/**
* @return {array} messages
*/
function onMessage(userId, message) {
  _messages.push({userId: userId, message: message});
  QBStore.emitChange();
}
QB.chat.onMessageListener = onMessage;

/**
* @param {string} message
*/
function sendMessage(message) {
  QB.chat.send(_opponentId, {
    type: 'chat',
    body: message,
    extension: {
      save_to_history: 1,
    }
  });
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
        .then(function (user) {
          QBStore.emitChange();
        });
        break;

      case QBConstants.SIGN_IN:
        signIn(action.name, action.password)
        .then(function (user) {
          QBStore.emitChange();
        });
        break;

      case QBConstants.SIGN_OUT:
        signOut();
        QBStore.emitChange();
        break;

      case QBConstants.SEND:
        sendMessage(action.message);
        QBStore.emitChange();
        break;
    }

    return true; // No errors. Needed by promise in Dispatcher.
  })

});

module.exports = QBStore;
