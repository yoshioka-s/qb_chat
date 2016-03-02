var React = require('react');
var ReactDOM = require('react-dom');
var ChatModule = require('./components/ChatModule.jsx');

// $(function () {
//   $('#begin-chat').on('click', function (event) {
//     openChat();
//   });
//
//   $('#send-message').on('click', function (event) {
//     postMessage($('#chat-message').val())
//     .then(function () {
//       console.log('message sent');
//     });
//   });
// });
//
// function openChat() {
//
// }
//
// function postMessage(message) {
//   return $.ajax({
//     method: 'POST',
//     url: '/chat/',
//     dataType: 'json',
//     data: {}
//   })
//   .done(function (response) {
//     console.log(response);
//
//   })
//   .fail(function (response) {
//     console.error(response);
//
//   });
// }
ReactDOM.render(
  <div>
    <ChatModule/>
  </div>,
  document.getElementById('chat-module')
);
