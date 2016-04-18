var Promise = require('bluebird').Promise;
var _ = require('underscore');
var QB = require('quickblox');
var CREDENTIALS = require('../../../settings/quickblox.js');

const NOTIFICATIONS = {newDialog: 1, warning: 2};

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
* @param {array} tags for the user (optional)
* @return {Promise}
*/
function signUp(name, password, tags) {
  if (!tags) {
    tags = [];
  }
  return new Promise(function (resolve, reject) {
    QB.users.create({
      login: name,
      password: password,
      tag_list: tags
    }, function(err, user){
      if (!user) {
        // error
        console.error(err);
        reject(parseError(err));
        return;
      }
      // success
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
* create new dialog with operators on user signUp
* @param {string} name of the dialog
* @param {array} occupantIds
* @return {Promise}
*/
function createDialog(name, occupantIds) {
  console.log('createDialog');
  return new Promise(function (resolve, reject) {
    var params = {
      type: 2,
      occupants_ids: occupantIds,
      name: name,
      data: {
        class_name: 'shop_dialog',
        shopId: 'shopId',
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
      // send notification to occupants
      var msg = {
        type: 'chat',
        extension: {
          save_to_history: 1,
          notification_type: NOTIFICATIONS.newDialog,
          roomJid: newDialog.xmpp_room_jid
        }
      };
      // send to every occupants
      _.each(occupantIds, function (occupantId) {
        console.log('send', occupantId, msg);
        QB.chat.send(occupantId, msg);
      });
      console.log('sent');

      // join to the new dialog
      joinDialog(newDialog.xmpp_room_jid)
      .then(function (dialogId) {
        resolve(newDialog);
      });
    });
  });
}

/**
* join dialog
* @param {string} roomJid of the dialog
* @return {Promise}
*/
function joinDialog(roomJid) {
  return new Promise(function (resolve, reject) {
    QB.chat.muc.join(roomJid, function(resultStanza) {
      console.log('joined');
      var joined = _.every(resultStanza.childNodes, function (item) {
        return item.tagName !== 'error';
      });
      if (joined) {
        console.log('joined', roomJid);
        resolve(roomJid);
      } else {
        reject();
      }
    });
  });
}

/**
* retrieve dialogs (group chat only)
* @return {Promise}
*/
function retrieveDialogs() {
  allDialogs = [];
  var limit = 5;  // limit for 1 API request
  var total;
  return new Promise(function (resolve, reject) {
    // recursive function
    function listDialogs(skip) {
      var filters = {
        type: 2,  // retrieve group chats only
        sort_desc: 'created_at',
        limit: limit,
        skip: skip
      };
      QB.chat.dialog.list(filters, function(err, resDialogs) {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
        total = resDialogs.total_entries;
        allDialogs = allDialogs.concat(resDialogs.items);
        // recurse until all dialogs are retrieved
        if (allDialogs.length < total) {
          listDialogs(skip + limit);
        } else {
          // resolve when all dialogs are retrieved
          resolve(allDialogs);
        }
      });
    }
    // invoke the recursive function
    listDialogs(0);
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
      resolve(messages);
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
* @param {string} occupnat
* @param {array} options for select (optional)
* @param {array} files (optional)
* @param {number} notificationType (optional)
*/
function sendMessage(message, to, options, files, notificationType) {
  console.log('sendMessage to: ', to);
  var extension = {
    save_to_history: 1
  };
  if (notificationType) {
    extension.notification_type = notificationType;
  }

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
  return QB.chat.send(to, data);
}

/**
* upload
* @param {object} file object
* @return {Promise}
*/
function uploadFile(inputFile) {
  return new Promise(function (resolve, reject) {
    var params = {
      name: inputFile.name,
      file: inputFile,
      type: inputFile.type,
      size: inputFile.size,
      public: false
    };
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
* send warning to a room
* @param {string} to
*/
function sendWarning(to) {
  var extension = {
    save_to_history: 1
  };

  var data = {
    type: 'chat',
    extension: {
      save_to_history: 1,
      body: 'warning',
      notification_type: NOTIFICATIONS.warning
    }
  };
  QB.chat.send(to, data);
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

/**
* @param {array} tags
* @return {array} users
*/
function getUsersByTags(tags) {
  return new Promise(function (resolve, reject) {
    var params = { tags: tags};
    QB.users.get(params, function(err, response){
      if (!response) {
        console.error(err);
        reject(err);
        return;
      }
      var users = _.map(response.items, function (item) {
        return item.user;
      });
      resolve(users);
    });
  });
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
  updateMainOperator: updateMainOperator,
  getUsersByTags: getUsersByTags,
  sendWarning: sendWarning
};
