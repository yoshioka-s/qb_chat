var React = require('react');
var ReactDOM = require('react-dom');
var ChatModule = require('./components/ChatModule.jsx');

ReactDOM.render(
  <div>
    <ChatModule adminIds={[10547143]}/>
  </div>,
  document.getElementById('chat-module')
);
