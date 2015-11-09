var proxyquire = require('proxyquire');
var sinon = require('sinon');

exports.plexAPIStubs = function() {
    before('set up main module with stubs for all plex-api methods', function () {
        var self = this;
        this.plexAPIStubs = null;
        this.plexAPIUtils = {
            stubAll      : function () {
                sinon.stub(self.plexAPIStubs, 'query').rejects(new Error('Unhandled URI in query stub'));
                sinon.stub(self.plexAPIStubs, 'postQuery').rejects(new Error('Unhandled URI in postQuery stub'));
                sinon.stub(self.plexAPIStubs, 'perform').rejects(new Error('Unhandled URI in perform stub'));
                sinon.stub(self.plexAPIStubs, 'find').rejects(new Error('Unhandled URI in find stub'));
            }, restoreAll: function () {
                self.plexAPIStubs.query.restore();
                self.plexAPIStubs.postQuery.restore();
                self.plexAPIStubs.perform.restore();
                self.plexAPIStubs.find.restore();
            }, construct : function (opts) {
                self.plexAPIStubs = this;
                self.plexAPIStubs.query = function () {};
                self.plexAPIStubs.postQuery = function () {};
                self.plexAPIStubs.perform = function () {};
                self.plexAPIStubs.find = function () {};
            }
        };
    });

    beforeEach('Reset all plex-api stubs', function() {
        if(process.env.NODE_ENV === 'test') {
            var PlexAPI = this.plexAPIUtils.construct;
            this.plexAPI = new PlexAPI({
                hostname: "MOCHA_STUB_HOSTNAME",
                authenticator: {authenticate: function() {throw new Error("Error in Mocha test: plexAPI.authenticator not set")}}
            });


        } else if (process.env.NODE_ENV === 'test-live'){
            var PlexAPI = require("plex-api");
            this.plexAPI = new PlexAPI({
                hostname: "192.168.0.1",
                authenticator: {authenticate: function() {throw new Error("Error in Mocha test: plexAPI.authenticator not set")}}
            });

            this.plexAPIUtils.construct();

        }

        this.plexAPIUtils.stubAll();
    });

    afterEach('Restore all plex-api stubs to blank methods', function() {
        this.plexAPIUtils.restoreAll();
        delete this.plexAPI;
    });
};