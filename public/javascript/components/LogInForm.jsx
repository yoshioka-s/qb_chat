var React = require('react');
var QBActions = require('../actions/QBActions.js');

var LogInForm = React.createClass({
  getInitialState: function () {
    return {
      errorMsg: '',
      hasAccount: false
    };
  },

  /**
  * submit sign up / log in info to server
  */
  submit: function () {
    if (this.state.hasAccount) {
      // sign in
      QBActions.signIn(this.state.name, this.state.password);
      return
    }
    // sign up
    // passwordConfirm
    if (this.state.password !== this.state.passwordConfirm) {
      this.setState({errorMsg: 'password does not match.'});
      return;
    }
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
        <input type="name" onChange={this.onNameChange} placeholder="user name"></input><br></br>
        <input type="password" onChange={this.onPassChange} placeholder="password"></input><br></br>
        {passwordConfirm}
        <p>{this.state.errorMsg}</p>
        <input type="submit" onClick={this.submit} value={submitText}></input>

        <p><a href="#" onClick={this.toggleMode}>{toggleText}</a></p>
      </div>
    );
  }
});

module.exports = LogInForm;
