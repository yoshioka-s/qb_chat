var React = require('react');
var $ = require('jquery');
var Promise = require('bluebird');
var QB = require('quickblox');

var ChatModule = React.createClass({
  render: function () {
    return (
      <div className="quickblox-chat">
        <h4>Hello</h4>
        <button type="button" className="btn" id="begin-chat">Chat Now</button>
        <div className="chat-form">
          <div className="chat-display">

          </div>

          <div className="chat-input">
            <input type="text" name="message" value="" placeholder="type message here" id="chat-message"></input>
            <input type="button" name="submit" value="send" id="send-message"></input>
          </div>

        </div>
      </div>
    );
  }
});

module.exports = ChatModule;
