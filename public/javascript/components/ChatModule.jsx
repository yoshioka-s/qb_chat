var React = require('react');
var QBActions = require('../actions/QBActions.js');
var QBStore = require('../stores/QBStore');
var LogInForm = require('./LogInForm.jsx');

// TODO: select response
// TODO: admin get list of chats
// TODO: get secret info from server


var ChatModule = React.createClass({
  getInitialState: function () {
    return {
      isFormShown: false,
      messages: QBStore.getMessages(),
      isLoggedIn: false,
      sessionToken: QBStore.getSessionToken()
    };
  },

  componentDidMount: function() {
    QBStore.addChangeListener(this._onChange);
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

  sendFile: function () {
    var inputFile = $("input[type=file]")[0].files[0];
    QBActions.uploadFile(inputFile);
  },

  signOut: function (argument) {
    QBActions.signOut();
  },


  render: function () {
    var state = this.state;
    var logInClass = this.state.isFormShown && !this.state.isLoggedIn ? 'shown' : 'hidden';
    var chatClass = this.state.isFormShown && this.state.isLoggedIn ? 'shown' : 'hidden';
    var chatNowText = this.state.isFormShown ? 'Hide Chat' : 'Chat Now';

    var messages = this.state.messages.map(function (message) {
      var className = "message " + (message.isAdmin ? 'admin' : 'customer');
      var attachments = [];
      console.log(message);
      if (message.attachments&&message.attachments.length > 0) {
        attachments = message.attachments.map(function (file) {
          return (<br><a href={"http://api.quickblox.com/blobs/"+file.id+"/download?token="+state.sessionToken}>{file.name}</a>);
        });
      }
      console.log(attachments);
      return (
        <div className={ className }>
          {message.text}
          { attachments }
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
            <input type="file" onChange={this.sendFile}></input>
          </div>

        </div>
        <div className={logInClass}>
          <LogInForm />
        </div>
      </div>
    );
  },

  _onChange: function () {
    console.log(QBStore.getMessages());
    this.setState({
      messages: QBStore.getMessages(),
      isLoggedIn: !!QBStore.getUser(),
      sessionToken: QBStore.getSessionToken()
    });
  }
});



module.exports = ChatModule;
