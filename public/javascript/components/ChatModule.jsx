var React = require('react');
// var $ = require('jquery');
// var Promise = require('bluebird');
var QB = require('quickblox');

var ChatModule = React.createClass({
  getInitialState: function () {
    return {
      isFormShown: false
    };
  },

  /**
  * open the chat form
  */
  toggleChat: function () {
    if (this.state.isFormShown) {
      this.setState({isFormShown: false});
    } else {
      this.setState({isFormShown: true});
    }
  },

  /**
  * send user message to server
  */
  submitMessage: function () {
    var newMessage = this.state.newMessage;
    // TODO: post request to the server
    this.setState({newMessage: ''});
  }


  render: function () {
    var formToggleClass = this.state.isFormShown ? 'shown' : 'hidden';
    var chatNowText = this.state.isFormShown ? 'Hide Chat' : 'Chat Now';

    return (
      <div className="quickblox-chat">
        <h4>Hello</h4>
        <button className="btn" onClick={this.toggleChat} >{chatNowText}</button>
        <div className={formToggleClass + ' chat-form'}>
          <div className="chat-display">
            <div className="message customer">
              customer message
            </div>
            <div className="message admin">
              admin message
            </div>
            <br className="clear"></br>
          </div>

          <div className="chat-input">
            <input type="text" name="message" value={this.state.newMessage} placeholder="type message here"></input>
            <input type="button" onClick={this.submitMessage}></input>
          </div>

        </div>
      </div>
    );
  }
});



module.exports = ChatModule;
