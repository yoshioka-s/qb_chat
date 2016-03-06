var React = require('react');
var QBActions = require('../actions/QBActions.js');
var QBStore = require('../stores/QBStore');
var LogInForm = require('./LogInForm.jsx');


var ChatModule = React.createClass({
  getInitialState: function () {
    return {
      isFormShown: false
    };
  },

  componentDidMount: function() {
    QBStore.addChangeListener(this._onChange);
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

  onChangeMessage: function (e) {
    this.setState({newMessage: e.target.value});
  },

  sendMessage: function () {
    QBActions.sendMessage(this.state.newMessage);
    this.setState({newMessage: ''});
  },

  signOut: function (argument) {
    QBActions.signOut();
  },


  render: function () {
    var formToggleClass = this.state.isFormShown ? 'shown' : 'hidden';
    var chatNowText = this.state.isFormShown ? 'Hide Chat' : 'Chat Now';

    return (
      <div className="quickblox-chat">
        <button onClick={this.signOut}>Sign out</button>
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
            <input type="text" name="message" onChange={this.onChangeMessage} placeholder="type message here"></input>
            <input type="button" onClick={this.sendMessage}></input>
          </div>

        </div>

        <LogInForm/>
      </div>
    );
  },

  _onChange: function () {
    console.log(QBStore.getMessages());
    this.setState({
      messages: QBStore.getMessages()
    });
  }
});



module.exports = ChatModule;
