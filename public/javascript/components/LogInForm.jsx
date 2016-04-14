var React = require('react');
var QBStore = require('../stores/QBStore');
var QBActions = require('../actions/QBActions.js');

var LogInForm = React.createClass({
  getInitialState: function () {
    return {
      hasAccount: true,
      confirmError: ''
    };
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
      <div>
        <h3>{title}</h3>

        <input type="text" onChange={this.onNameChange} placeholder="user name"></input>
        <span className="error-message">{QBStore.getLoginErrors().username}</span>
        <br></br>

        <input type="password" onChange={this.onPassChange} placeholder="password"></input>
        <span className="error-message">{QBStore.getLoginErrors().password}</span>
        <br></br>

        {passwordConfirm}
        <span className="error-message">{this.state.confirmError}</span>
        <br></br>

        <input type="submit" onClick={this.submit} value={submitText} className="btn"></input>

        <p><a href="#" onClick={this.toggleMode}>{toggleText}</a></p>
      </div>
    );
  }
});

module.exports = LogInForm;
