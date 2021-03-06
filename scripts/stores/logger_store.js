"use strict";

var AppDispatcher = require("../dispatchers/app_dispatcher");
var Immutable = require("immutable");
var EventEmitter = require("events").EventEmitter;
var Constants = require("../constants/app_constants");
var ActionTypes = Constants.ActionTypes;
var safeJSONParse = require("../lib/safe_json_parse");
var Projections = require("../projections/app_projections");
var CHANGE_EVENT = Constants.ChangeTypes.LOG_CHANGE;
var whitelist = Immutable.fromJS({
  on: ["*"],
  off: ["*"],
  trigger: ["*"],
  dialog: ["show"],
  menu: ["set", "unset", "clear"],
  store: ["watch", "unwatch", "set", "unset", "get"],
  title: ["set"],
  flash: ["primary", "success", "info", "danger", "warning"],
  authenticate: ["*"]
});

class LoggerStore extends EventEmitter {
  constructor() {
    this.reset();
    this._registerInterests();
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

  replaceState(state) {
    this._state = state;
    this.emitChange();
  }

  reset() {
    this._state = Immutable.List();
  }

  filteredHistory(filters) {
    return this._state.filter((item) => {
      return Immutable.fromJS(filters).contains(item.get("type"));
    });
  }

  getLogs(...filters) {
    if(filters.length === 0 || filters[0] === undefined) {
      return this._state;
    }
    return this.filteredHistory(filters);
  }

  getLogTypes() {
    return this._state.reduce((acc, item) => {
      return acc.add(item.get("type"));
    }, Immutable.Set());
  }

  hasWildcardSubtype(data) {
    return whitelist.get(data.type).contains("*");
  }

  isSubtypeInWhitelist(data) {
    if (this.hasWildcardSubtype(data)) {
      return true;
    }
    return whitelist.get(data.type).contains(data.payload.type);
  }

  isTypeInWhitelist(data) {
    return whitelist.has(data.type);
  }

  _receivePostMessage(data) {
    if(this.isTypeInWhitelist(data) && this.isSubtypeInWhitelist(data)) {
      data = Immutable.fromJS(data)
        .set("direction", "from");
      this._state = this._state.push(Immutable.Map(data));
    }
  }

  _receiveGeneratedMessage(data) {
    data = Projections.generatorPayload(data)
      .set("direction", "to");
    this._state = this._state.push(Immutable.Map(data));
  }

  _receiveMenuInteraction(type) {
    var data = Immutable.fromJS({
      direction: "to",
      type: "menu",
      payload: {
       type: type
      }
    });
    this._state = this._state.push(Immutable.Map(data));
  }

  _receiveFlashInteraction(data) {
    data = Immutable.fromJS({
      direction: "to",
      type: "flash",
      payload: {
       type: data.interaction
      }
    });
    this._state = this._state.push(Immutable.Map(data));
  }

  _receiveStoreConfiguration(data) {
    var payload = Immutable.Map()
      .setIn(["data", "key"], data.get("key").split(".")[1])
      .setIn(["data", "value"], Immutable.fromJS(safeJSONParse(data.get("value"))));
    data = Projections.storePayload(payload)
      .set("direction", "to")
      .setIn(["payload", "type"], "set");
    this._state = this._state.push(data);
  }

  _deleteStoreItem(key) {
    var payload = Immutable.Map()
      .setIn(["data", "key"], key.split(".")[1]);
    payload = Projections.storePayload(payload)
      .set("direction", "to")
      .setIn(["payload", "type"], "unset");
    this._state = this._state.push(payload);
  }

  _registerInterests() {
    this.dispatchIndex = AppDispatcher.register((action) => {
      switch(action.type) {
        case ActionTypes.RECEIVE_POST_MESSAGE:
          this._receivePostMessage(action.payload);
        break;
        case ActionTypes.RECEIVE_GENERATED_MESSAGE:
          this._receiveGeneratedMessage(action.payload);
        break;
        case ActionTypes.RECEIVE_STORE_CONFIGURATION:
          this._receiveStoreConfiguration(action.payload);
        break;
        case ActionTypes.DELETE_STORE_ITEM:
          this._deleteStoreItem(action.payload);
        break;
        case ActionTypes.FLASH_INTERACTION:
          this._receiveFlashInteraction(action.payload);
        break;
        case ActionTypes.MENU_INTERACTION:
          this._receiveMenuInteraction(action.payload);
        break;
        case ActionTypes.CLEAR_LOG:
          this.reset();
        break;
      }
      this.emitChange();
      return true;
    });
  }
}

module.exports = new LoggerStore();
