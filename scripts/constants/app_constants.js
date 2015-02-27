"use strict";
var keyMirror = require("react/lib/keyMirror");

module.exports = {
  ActionTypes: keyMirror({
    RECEIVE_POST_MESSAGE: null,
    START_APP_TIMEOUT: null
  }),
  ChangeTypes: keyMirror({
    APP_CHANGE: null
  }),
  Timer: {
    DURATION: 2000,
  }
};