var AppDispatcher = require('../dispatcher/AppDispatcher.js');
var QBConstants = require('../constants/QBConstants.js');

var QBActions = {

  /**
  * @param  {string} user name
  * @param  {string} password
  */
  signUp: function(name, password) {
    AppDispatcher.handleViewAction({
      actionType: QBConstants.SIGN_UP,
      name: name,
      password: password
    });
  },

  /**
  * @param  {string} user name
  * @param  {string} password
  */
  signIn: function(name, password) {
    AppDispatcher.handleViewAction({
      actionType: QBConstants.SIGN_IN,
      name: name,
      password: password
    });
  },

  signOut: function() {
    AppDispatcher.handleViewAction({
      actionType: QBConstants.SIGN_OUT
    });
  },

  /**
  * @param  {string} message
  */
  sendMessage: function(message, options) {
    AppDispatcher.handleViewAction({
      actionType: QBConstants.SEND,
      message: message,
      options: options
    });
  },

  /**
  * @param  {string} message
  */
  uploadFile: function(inputFile) {
    AppDispatcher.handleViewAction({
      actionType: QBConstants.UPLOAD,
      inputFile: inputFile
    });
  },

  switchDialog: function (dialogId) {
    AppDispatcher.handleViewAction({
      actionType: QBConstants.SWITCH,
      dialogId: dialogId
    });
  }
};

module.exports = QBActions;
