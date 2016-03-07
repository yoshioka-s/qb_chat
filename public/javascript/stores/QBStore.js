var AppDispatcher = require('../dispatcher/AppDispatcher.js');
var QBConstants = require('../constants/QBConstants');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var Promise = require('bluebird').Promise;
var QB = require('quickblox');
var CREDENTIALS = require('../../../settings/quickblox.js');
var supportAccount = require('../../../settings/account.js');

var CHANGE_EVENT = 'change';

QB.init(CREDENTIALS.appId, CREDENTIALS.authKey, CREDENTIALS.authSecret);

var _user =  null;
var _messages = [{isAdmin:true, text:'admin'}, {isAdmin:false, text:'customer'}];
var _opponentId = supportAccount.userId;

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
    QB.createSession({login: name, password: password}, function(err, res){
      if (!res) {
        // error
        console.error(err);
        rejecct(err);
      }
      // success
      console.log(res);
      _user = res.user_id;
      console.log('user', _user);
      QB.chat.connect({userId: _user, password: password}, function(err, roster) {
        if (err) {
          console.log(err);
          reject(err);
          return;
        }
        console.log('connected', roster);
        resolve(roster);
      });
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
    _opponentId = res.opponentId;
  });
}

/**
* @return {array} messages
*/
function onMessage(userId, message) {
  console.log('onMessage',userId, message);
  _messages.push({isAdmin: userId===_opponentId, text: message.body});
  QBStore.emitChange();
}
QB.chat.onMessageListener = onMessage;

/**
* @param {string} message
*/
function sendMessage(message) {
  console.log('sendMessage', message);
  QB.chat.send(_opponentId, {
    type: 'chat',
    body: message,
    extension: {
      save_to_history: 1,
    }
  });
  _messages.push({isAdmin: false, text: message});
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
        .then(function (res) {
          return openChat(res);
        })
        .then(function () {
          QBStore.emitChange();
        });
        break;

      case QBConstants.SIGN_IN:
        signIn(action.name, action.password)
        .then(function (res) {
          return openChat(res);
        })
        .then(function () {
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
