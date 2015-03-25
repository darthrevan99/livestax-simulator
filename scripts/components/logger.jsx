"use strict";

var React = require("react");
var Immutable = require("immutable");
var CollapsiblePanel = require("./lib/collapsible_panel");
var LogStore = require("../stores/logger_store");
var LoggerActions = require("../actions/logger_actions");

var getState = () => {
  return Immutable.Map({
    logs: LogStore.getLogs()
  });
};

var Logger = React.createClass({
  getInitialState: getState,

  componentDidMount() {
    LogStore.addChangeListener(this._onChange);
  },

  componentWillUnmount() {
    LogStore.removeChangeListener(this._onChange);
  },

  componentWillUpdate() {
    var node = this.getDOMNode().querySelector(".panel-collapse");
    this.shouldScroll = node.scrollTop + node.offsetHeight >= node.scrollHeight;
  },

  componentDidUpdate() {
    if (this.shouldScroll) {
      var node = this.getDOMNode().querySelector(".panel-collapse");
      node.scrollTop = node.scrollHeight;
    }
  },

  _onChange() {
    this.replaceState(getState());
  },

  clear() {
    LoggerActions.clearLog();
  },

  _renderLog(log, key) {
    var payload = log.get("payload");
    var subtype = (<span className="text-muted">null</span>);

    if(payload) {
      if(payload.has("type")) {
        subtype = payload.get("type");
        payload = payload.delete("type");
      }

      if(!payload.isEmpty()) {
        payload = JSON.stringify(payload.toJS());
      } else {
        payload = undefined;
      }
    }

    return (<tr key={key}>
        <td>{log.get("type")}</td>
        <td>{subtype}</td>
        <td>{payload}</td>
      </tr>);
  },

  render() {
    var logs = this.state.get("logs").map(this._renderLog).toJS();

    if (this.state.get("logs").size === 0) {
      return (
        <CollapsiblePanel heading="Logger">
          <h2>Events to and from the app will appear in this panel.</h2>
        </CollapsiblePanel>
      );
    }

    return (
      <CollapsiblePanel heading="Logger">
        <div className="logger-actions">
          <button className="btn btn-primary btn-xs clear-logger" onClick={this.clear}>
            Clear
          </button>
        </div>
        <table className="table table-condensed table-hover logger-table">
          <tbody>
            {logs}
          </tbody>
        </table>
      </CollapsiblePanel>
    );
  },
});

module.exports = Logger;