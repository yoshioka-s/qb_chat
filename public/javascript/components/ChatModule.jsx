var React = require('react');
var _ = require('underscore');
var QBActions = require('../actions/QBActions.js');
var QBStore = require('../stores/QBStore');
var LogInForm = require('./LogInForm.jsx');
var ChatList = require('./ChatList.jsx');

var ChatModule = React.createClass({
  getInitialState: function () {
    return {
      isFormShown: false,
      currentUser: false,
      newMessage: '',
      isOptionInput: false,
      newOptions: [],
      newOption: ''
    };
  },

  componentDidMount: function() {
    QBStore.addChangeListener(this._onChange);
    if (this.state.isOptionInput) {
      this.refs.optionInput.focus();
    }
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

  selectOption: function (e) {
    QBActions.sendMessage(e.target.value);
  },

  sendMessage: function () {
    QBActions.sendMessage(this.state.newMessage, this.state.newOptions);
    this.setState({
      newMessage: '',
      isOptionInput: false,
      newOptions: [],
      newOption: ''
    });
  },

  sendFile: function () {
    var inputFile = $("input[type=file]")[0].files[0];
    QBActions.uploadFile(inputFile);
  },

  showOptionInput: function () {
    if (this.state.newOption.trim().length === 0) {
      this.setState({isOptionInput: true});
      return;
    }
    // OK, add this to options
    var options = this.state.newOptions;
    options.push(this.state.newOption.trim());
    this.setState({newOption: '', newOptions: options, isOptionInput: false});
  },

  onChangeOptionInput: function (e) {
    this.setState({newOption: e.target.value});
  },

  signOut: function (argument) {
    QBActions.signOut();
    this.setState({
      newMessage: '',
      isOptionInput: false,
      newOptions: [],
      newOption: ''
    });
  },


  render: function () {
    var chatModule = this;
    var state = this.state;
    var logInClass = state.isFormShown && !state.currentUser ? 'shown' : 'hidden';
    var chatClass = state.isFormShown && state.currentUser ? 'shown' : 'hidden';
    var chatNowText = state.isFormShown ? 'Hide Chat' : 'Chat Now';

    var messages = QBStore.getMessages().map(function (messageObj, messageKey) {
      // each message view
      var className = "message ";
      if (messageObj.sender_id===state.currentUser.id) {
        className += 'operator'
      } else {
        className += messageObj.notification_type == 3 ? 'server' : 'customer';
      }

      var options = [];
      options = _.map(messageObj, function (value, key) {
        if (key.indexOf('customParam') === 0) {
          return (
            <p key={key}>
              <input type="radio" name="option" onClick={chatModule.selectOption} value={value}></input>{value}
            </p>
          );
        }
      });

      var attachments = [];
      if (messageObj.attachments&&messageObj.attachments.length > 0) {
        attachments = _.map(messageObj.attachments, function (file, key) {
          return (
            <p key={key}>
              <a href={"http://api.quickblox.com/blobs/"+file.id+"/download?token="+QBStore.getSessionToken()}>{file.name}</a>
            </p>
          );
        });
      }

      setTimeout(function () {
        var chatDisplay = $('.chat-display');
        chatDisplay.scrollTop(chatDisplay.prop("scrollHeight"));
      }, 100);

      return (
        <div className={ className } key={messageKey}>
          <div dangerouslySetInnerHTML={createMarkup(messageObj.message)}></div>
          { attachments }
          { options }
        </div>
      );
    });

    var newOptions = _.map(this.state.newOptions, function (newOption, key) {
      return <p key={key}><input type="radio"></input>{newOption}</p>
    });

    var files = _.map(QBStore.getUploadedFiles(), function (file, key) {
      return <p key={key}>{file.name}</p>;
    });

    return (
      <div className="quickblox-chat">
        <button className="btn" onClick={this.toggleForm} >{chatNowText}</button>
        <button className={chatClass + ' btn'} onClick={this.signOut}>Sign out</button>
        <ChatList dialogs={QBStore.getDialogs()}/>
        <div className={chatClass + ' chat-form'}>
          <br></br>
          <div className="chat-display">
            {messages}
            <br className="clear"></br>
          </div>

          <div className="chat-input">
            <div className="new-options">
              <input type="text" className={this.state.isOptionInput ? '':'hidden'} onChange={this.onChangeOptionInput} value={this.state.newOption} ref="optionInput"></input>
              <button className="btn" onClick={this.showOptionInput}>{this.state.isOptionInput ? 'OK':'add option'}</button>
              {newOptions}
            </div>
            <div className="uploaded-files">
              <input type="file" className="" onChange={this.sendFile}></input>
              {files}
            </div>
            <textarea className="message-input" name="message" onChange={this.onChangeMessage} value={state.newMessage} placeholder="type message here"></textarea>
            <br></br>
            <div className="align-right">
              <input type="button" className="btn" onClick={this.sendMessage} value="send"></input>
            </div>
          </div>

        </div>
        <div className={logInClass}>
          <LogInForm loginErrors={QBStore.getLoginErrors()}/>
        </div>
      </div>
    );
  },

  _onChange: function () {
    this.setState({
      currentUser: QBStore.getUser()
    });
  }
});

function createMarkup(text) {
  return {__html: text};
}

module.exports = ChatModule;
