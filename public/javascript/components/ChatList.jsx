var React = require('react');
var ReactPropTypes = React.PropTypes;
var QBActions = require('../actions/QBActions.js');

var ChatList = React.createClass({
  propTypes: {
    dialogs: ReactPropTypes.array.isRequired
  },

  getInitialState: function () {
    return {
      dialogId: null
    };
  },

  switchDialog: function (event) {
    var dialogId = $(event.currentTarget).data('target');
    QBActions.switchDialog(dialogId);
    this.setState({dialogId: dialogId});
  },

  render: function () {
    var chatList = this;
    var dialogs = this.props.dialogs.map(function (dialog) {
      var selectedClass = chatList.state.dialogId === dialog._id ? 'selected':'';
      return (
        <div className={'btn dialog-btn '+selectedClass}
          onClick={chatList.switchDialog}
          data-target={dialog._id}
          key={dialog._id}
        >
          {dialog.name}
        </div>);
    });
    // if (dialogs.length === 1) {
    //   dialogs = [];
    // }

    return (
      <div className="quickblox-customer-list">
        {dialogs}
      </div>
    );
  }

});

module.exports = ChatList;
