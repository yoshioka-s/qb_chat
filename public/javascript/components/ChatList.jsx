var React = require('react');
var QBActions = require('../actions/QBActions.js');
var QBStore = require('../stores/QBStore');

// TODO: admin module
// TODO: admin get list of chats


var ChatList = React.createClass({
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
    var dialogs = QBStore.getDialogs().map(function (dialog) {
      var selectedClass = chatList.state.dialogId === dialog._id ? 'selected':'';
      return (<div className={'btn dialog-btn '+selectedClass}
          onClick={chatList.switchDialog}
          data-target={dialog._id}
        >
          {dialog.name}
        </div>);
    });
    if (dialogs.length === 1) {
      dialogs = [];
    }

    return (
      <div className="quickblox-customer-list">
        {dialogs}
      </div>
    );
  }

});



module.exports = ChatList;
