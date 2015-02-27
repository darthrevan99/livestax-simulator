"use strict";

require("../test_helper");

var AppStore = require("../../scripts/stores/app_store");
var AppActions = require("../../scripts/actions/app_actions");
var Constants = require("../../scripts/constants/app_constants");

describe("AppStore", () => {
  var clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    AppStore.reset();
  });

  afterEach(() => {
    clock.restore();
  });

  describe("getApp()", () => {
    it("has a default status of loading", () => {
      expect(AppStore.getApp()).to.eql({ status: "loading" });
    });

    describe("when a ready mesage is received", () => {
      it("updates the status to ready", () => {
        AppActions.receivePostMessage({ type: "ready" });
        expect(AppStore.getApp()).to.eql({ status: "ready" });
      });
    });

    describe("when a ready mesage is not received", () => {
      it("updates the status to timeout", () => {
        clock.tick(Constants.Timer.DURATION);
        expect(AppStore.getApp()).to.eql({ status: "timeout" });
      });
    });
  });
});