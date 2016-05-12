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
      var state = ' ';
      if (dialog.last_message_user_id === dialog.data.customerId) {
        if (dialog.last_message === 'warning') {
          state = 'warning';
        }
        if (dialog.last_message === 'urgent') {
          state = 'urgent';
        }
      }
      var selectedClass = chatList.state.dialogId === dialog._id ? 'selected':'';
      return (
        <div className={'btn dialog-btn '+selectedClass+' '+state}
          onClick={chatList.switchDialog}
          data-target={dialog._id}
          key={dialog._id}
        >
          {state}
        </div>);
    });

    return (
      <div className="quickblox-customer-list">
        {dialogs}
      </div>
    );
  }

});

module.exports = ChatList;
