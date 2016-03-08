var React = require('react');
var QBActions = require('../actions/QBActions.js');
var QBStore = require('../stores/QBStore');

// TODO: admin module
// TODO: admin get list of chats


var ChatList = React.createClass({
  getInitialState: function () {
    return {
      customers: QBStore.getCustomers,
      messages: QBStore.getMessages(),
      isLoggedIn: false
    };
  },

  /**
  * open the chat form
  */
  toggleForm: function () {
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
    console.log(this.state.newMessage);
    this.setState({newMessage: ''});
  },

  signOut: function (argument) {
    QBActions.signOut();
  },


  render: function () {
    var logInClass = this.state.isFormShown && !this.state.isLoggedIn ? 'shown' : 'hidden';
    var chatClass = this.state.isFormShown && this.state.isLoggedIn ? 'shown' : 'hidden';
    var chatNowText = this.state.isFormShown ? 'Hide Chat' : 'Chat Now';

    var messages = this.state.messages.map(function (message) {
      var className = "message " + (message.isAdmin ? 'admin' : 'customer');
      return (
        <div className={ className }>
          {message.text}
        </div>
      );
    });

    return (
      <div className="quickblox-chat">
        <button className={chatClass + ' btn'} onClick={this.signOut}>Sign out</button>
        <button className="btn" onClick={this.toggleForm} >{chatNowText}</button>
        <div className={chatClass + ' chat-form'}>
          <div className="chat-display">
            {messages}
            <br className="clear"></br>
          </div>

          <div className="chat-input">
            <input type="text" name="message" onChange={this.onChangeMessage} value={this.state.newMessage} placeholder="type message here"></input>
            <input type="button" onClick={this.sendMessage} value="send"></input>
          </div>

        </div>
        <div className={logInClass}>
          <LogInForm />
        </div>
      </div>
    );
  }

});



module.exports = ChatList;
