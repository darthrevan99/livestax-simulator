"use strict";

var AppDispatcher = require("../dispatchers/app_dispatcher");
var EventEmitter = require("events").EventEmitter;
var Constants = require("../constants/app_constants");
var ActionTypes = Constants.ActionTypes;
var AppActions = require("../actions/app_actions");
var CHANGE_EVENT = Constants.ChangeTypes.APP_CHANGE;
var State = require("./state");
var Timer = require("./timer");
var Immutable = require("immutable");

class AppStore extends EventEmitter {
  constructor() {
    this._registerInterests();
    this._timer = new Timer();
    this._subscribeToTimer();
    this.reset();
  }

  emitChange() {
    this.emit(CHANGE_EVENT);
  }

  addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  }

  removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }

  reset() {
    this.replaceState(State.initial());
    AppActions.startAppTimeout({ duration: Constants.Timer.DURATION });
  }

  setState(path, value) {
    this._state = this._state.setIn(path, value);
    this.emitChange();
  }

  replaceState(state) {
    if(!Immutable.is(state, Immutable.fromJS(state))) {
      console.warn("replaceState expects an Immutable data structure");
    }
    this._state = state;
    this.emitChange();
  }

  getApp() {
    return this._state;
  }

  _startTimer(data) {
    this._timer.start(data.duration);
  }

  _subscribeToTimer() {
    this._timer.on("complete", () => {
      this.setState(["status"], "timeout");
    });
  }

  _receivePostMessage(data) {
    if(data.type === "ready") {
      this._timer.cancel();
      this.setState(["status"], "ready");
    }
  }

  _setSignedRequestToDefaults() {
    this.setState(["post_data"], State.initial().get("post_data"));
  }

  _receiveAppConfiguration(data) {
    if (data) {
      this.setState(["app"], data.get("app"));

      if(data.getIn(["app", "use_post"])) {
        this.setState(["post_data"], data.get("post_data"));
      } else {
        this._setSignedRequestToDefaults();
      }
    }

    this.setState(["status"], "loading");
    this._startTimer({ duration: Constants.Timer.DURATION });
  }

  _registerInterests() {
    this.dispatchIndex = AppDispatcher.register((action) => {
      switch(action.type) {
        case ActionTypes.RECEIVE_POST_MESSAGE:
          this._receivePostMessage(action.payload);
        break;

        case ActionTypes.RECEIVE_APP_CONFIGURATION:
          this._receiveAppConfiguration(action.payload);
        break;

        case ActionTypes.START_APP_TIMEOUT:
          this._startTimer(action.payload);
        break;
      }
      return true;
    });
  }
}

module.exports = new AppStore();
