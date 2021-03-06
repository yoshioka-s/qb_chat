var React = require('react');
var ReactPropTypes = React.PropTypes;
var QBActions = require('../actions/QBActions.js');

var LogInForm = React.createClass({
  propTypes: {
    loginErrors: ReactPropTypes.object.isRequired
  },

  getInitialState: function () {
    return {
      hasAccount: true,
      confirmError: ''
    };
  },

  componentDidMount: function () {
    this.refs.nameInput.focus();
  },

  /**
  * submit sign up / log in info to server
  */
  submit: function () {
    if (this.state.hasAccount) {
      // sign in
      QBActions.signIn(this.state.name, this.state.password);
      this.setState({confirmError: ''});
      return;
    }
    // sign up
    // check passwordConfirm
    if (this.state.password !== this.state.passwordConfirm) {
      this.setState({confirmError: 'password does not match.'});
      return;
    }
    this.setState({confirmError: ''});
    QBActions.signUp(this.state.name, this.state.password);
  },

  keyPress: function (e) {
    if(e.key === 'Enter') {
      this.submit();
    }
  },

  toggleMode: function () {
    this.setState({hasAccount: !this.state.hasAccount})
  },
  onNameChange: function (e) {
    this.setState({name: e.target.value});
  },
  onPassChange: function (e) {
    this.setState({password: e.target.value});
  },
  onConfChange: function (e) {
    this.setState({passwordConfirm: e.target.value});
  },

  render: function () {
    var title = 'Sign Up to QuickBlox!';
    var submitText = 'sign up';
    var passwordConfirm = (
      <input type="password" onChange={this.onConfChange} placeholder="password (confirm)"></input>
    );
    var toggleText = 'already has an account?';
    if (this.state.hasAccount) {
      title = 'Log in to QuickBlox!';
      submitText = 'log in';
      passwordConfirm = '';
      toggleText = 'register now!';
    }

    return (
      <div onKeyPress={this.keyPress}>
        <h3>{title}</h3>

        <input type="text" onChange={this.onNameChange} placeholder="user name" ref="nameInput"></input>
        <span className="error-message">{this.props.loginErrors.username}</span>
        <br></br>

        <input type="password" onChange={this.onPassChange} placeholder="password"></input>
        <span className="error-message">{this.props.loginErrors.password}</span>
        <br></br>

        {passwordConfirm}
        <span className="error-message">{this.state.confirmError}</span>
        <br></br>

        <input type="submit" onClick={this.submit} value={submitText} className="btn"></input>
      </div>
    );
  }
});

module.exports = LogInForm;
