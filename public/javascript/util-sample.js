var currentUser;
$(function () {
  var SHOP_ID = 'testShop';
  $('#chat').hide();
  // login
  $('#login').click(function (event) {
    ChatUtils.autoLogin()
    .then(function (user) {
      console.log('login success!', user);
      currentUser = user;
      $('#chat').show();
    })
    .catch(function (error) {
      console.log('login fail!');
      console.error(error);
    });
  });

  // set on message event
  ChatUtils.setOnMessage(onMessage);

  // send message
  $('#submit').click(function (event) {
    event.preventDefault();
    ChatUtils.sendMessage(SHOP_ID, $('#message').val());
  });

  // send warning
  $('#warning').click(function (event) {
    event.preventDefault();
    ChatUtils.sendWarning(SHOP_ID);
  });

  // send server message and customer's response
  $('#forward').click(function (event) {
    event.preventDefault();
    ChatUtils.forwardMessages(SHOP_ID, 'server message', 'customer response');
  });

});

// show messages
function onMessage(userId, message) {
  var notifications = {newDialog: 1, warning: 2, server: 3, customer: 4, urgent: 5};
  console.log(message);
  var messageType = message.extension.notification_type;
  if (messageType == notifications.warning || messageType == notifications.urgent) {
    // warning or urgent notification has no message body.
    console.log('notification', messageType);
    return;
  }
  if (userId == currentUser.id) {
    // my message
    console.log('message successfuly sent!');
  }
  $('#message-list').append('<li>'+message.body+'</li>');
}
