var React = require('react');
var ReactDOM = require('react-dom');
var ChatModule = require('./components/ChatModule.jsx');

ReactDOM.render(
  <div>
    <ChatModule/>
  </div>,
  document.getElementById('chat-module')
);
