var React = require('react');
var _ = require('underscore');
var QBActions = require('../actions/QBActions.js');
var QBStore = require('../stores/QBStore');
var LogInForm = require('./LogInForm.jsx');
var ChatList = require('./ChatList.jsx');

var ChatModule = React.createClass({
  propTypes: {
    adminIds: React.PropTypes.array.isRequired
  },

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

  componentWillMount: function () {
    console.log(this.props.adminIds);
    QBActions.setAdmin(this.props.adminIds);
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

    var messages = QBStore.getMessages().map(function (messageObj) {
      // each message view
      var className = "message " + (messageObj.sender_id===state.currentUser ? 'admin' : 'customer');

      var options = [];
      _.each(messageObj, function (value, key) {
        if (key.indexOf('customParam') === 0) {
          options.push(<p><input type="radio" name="option" onClick={chatModule.selectOption} value={value}></input>{value}</p>);
        }
      })

      var attachments = [];
      if (messageObj.attachments&&messageObj.attachments.length > 0) {
        attachments = messageObj.attachments.map(function (file) {
          return (
            <p>
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
        <div className={ className }>
          {messageObj.message}
          { attachments }
          { options }
        </div>
      );
    });

    var newOptions = this.state.newOptions.map(function (newOption) {
      return <p><input type="radio"></input>{newOption}</p>
    });

    var files = _.map(QBStore.getUploadedFiles(), function (file) {
      return <p>{file.name}</p>;
    });

    return (
      <div className="quickblox-chat">
        <button className="btn" onClick={this.toggleForm} >{chatNowText}</button>
        <div className={chatClass + ' chat-form'}>
          <button className={chatClass + ' btn'} onClick={this.signOut}>Sign out</button>
          <ChatList />
          <div className="chat-display">
            {messages}
            <br className="clear"></br>
          </div>

          <div className="chat-input">
            <div className="new-options">
              <input type="text" className={this.state.isOptionInput ? '':'hidden'} onChange={this.onChangeOptionInput} value={this.state.newOption}></input>
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
          <LogInForm />
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

module.exports = ChatModule;
