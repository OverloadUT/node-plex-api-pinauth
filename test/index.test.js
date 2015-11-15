var expect = require('chai').expect;
var sinon = require('sinon');
var request = require('request');

describe('Main Module', function() {
    require('./query-stubs.helper.js').plexAPIStubs();

    it('should return an error before the user has authenticated', function(done){
        var module = require('../index.js')();
        module.authenticate(this.plexAPI, function(err, token) {
            console.log(err);
            expect(err).to.be.an('Error');
            done();
        })
    });

    it('should return a token if one is passed to the constructor', function(done){
        var module = require('../index.js')({token: 'MOCHA_TEST_PASSED_IN_TOKEN'});
        module.authenticate(this.plexAPI, function(err, token) {
            console.log(err);
            expect(err).to.not.be.an('Error');
            expect(token).to.equal('MOCHA_TEST_PASSED_IN_TOKEN');
            done();
        })
    });

    it('should throw error if first parameter is not an object', function(){
        var module = require('../index.js')();
        var fn = function() {
            module.authenticate('not an object', function() {});
        };
        expect(fn).to.throw(TypeError);
    });

    it('should throw error if second parameter is not a function', function(){
        var module = require('../index.js')();
        var self = this;
        var fn = function() {
            module.authenticate(self.plexAPI, 'not a function');
        };
        expect(fn).to.throw(TypeError);
    });

    it('should remember the plex-api object after initializing', function(){
        var module = require('../index.js')();
        module.initialize(this.plexAPI);
        expect(module.plexApi).to.equal(this.plexAPI);
    });

    describe("Successful Plex HTTP calls", function() {

        if (process.env.NODE_ENV !== 'test-live') {
            beforeEach('stub request.post to return successful data', function(){
                this.postStub = sinon.stub(request, 'post');
                this.postStub.withArgs(sinon.match.has('url', sinon.match('https://plex.tv/pins.xml')))
                    .yields(null, {statusCode: 201}, '<?xml version="1.0" encoding="UTF-8"?>\
                    <pin>\
                      <client-identifier>7f5f9e38-4954-4243-9516-fb8dfdfb4e99</client-identifier>\
                      <code>MOCA</code>\
                      <expires-at type="datetime">2015-11-14T23:58:40Z</expires-at>\
                      <id type="integer">12345678</id>\
                      <auth-token type="NilClass" nil="true"/>\
                      <auth_token nil="true"></auth_token>\
                    </pin>');
                // TODO make this cleaner. External file probably?
            });

            afterEach('reset request stubs', function() {
                this.postStub.restore();
            });
        }

        it('should get a new PIN', function(){
            var module = require('../index.js')();
            module.initialize(this.plexAPI);
            return expect(module.getNewPin()).to.eventually.deep.equal({code: 'MOCA', id: '12345678'});
        });
    });

    describe("Plex Server is not responding", function() {

        if (process.env.NODE_ENV !== 'test-live') {
            beforeEach('stub request.post to return successful data', function(){
                this.postStub = sinon.stub(request, 'post');
                this.postStub.yields(new Error('Server not responding'), {}, '');
            });

            afterEach('reset request stubs', function() {
                this.postStub.restore();
            });

            it('should handle the Plex server not responding', function(){
                var module = require('../index.js')();
                module.initialize(this.plexAPI);
                return expect(module.getNewPin()).to.be.rejected;
            });
        }
    });

    describe("Plex Server responding with 404 error codes", function() {

        if (process.env.NODE_ENV !== 'test-live') {
            beforeEach('stub request.post to return successful data', function(){
                this.postStub = sinon.stub(request, 'post');
                this.postStub.yields(null, {statusCode: 404}, '');
            });

            afterEach('reset request stubs', function() {
                this.postStub.restore();
            });

            it('should handle the Plex server not responding', function(){
                var module = require('../index.js')();
                module.initialize(this.plexAPI);
                return expect(module.getNewPin()).to.be.rejected;
            });
        }
    });
});