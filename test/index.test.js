var expect = require('chai').expect;
var sinon = require('sinon');
var request = require('request');

describe('Main Module', function() {
    require('./query-stubs.helper.js').plexAPIStubs();

    it('should return an error before the user has authenticated', function(done){
        var module = require('../index.js')();
        module.authenticate(this.plexAPI, function(err, token) {
            expect(err).to.be.an('Error');
            done();
        })
    });

    it('should return a token if one is passed to the constructor', function(done){
        var module = require('../index.js')({token: 'MOCHA_TEST_PASSED_IN_TOKEN'});
        module.authenticate(this.plexAPI, function(err, token) {
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

    describe("getNewPin public method", function() {
        if (process.env.NODE_ENV !== 'test-live') {
            beforeEach('stub request.post to return successful data', function() {
                this.postStub = sinon.stub(request, 'post');
            });

            afterEach('reset request stubs', function() {
                this.postStub.restore();
            });
        }

        describe("Plex server responding", function(){
            if (process.env.NODE_ENV !== 'test-live') {
                beforeEach('stub request.post to return successful data', function(){
                    // TODO make this cleaner. External files probably?
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
                });
            }

            it('should get a new PIN', function(){
                var module = require('../index.js')();
                module.initialize(this.plexAPI);
                return expect(module.getNewPin()).to.eventually.deep.equal({code: 'MOCA', id: '12345678'});
            });
        });

        describe("Plex server responds with unparsable PIN code", function(){
            if (process.env.NODE_ENV !== 'test-live') {
                beforeEach('stub request.post to return successful data', function(){
                    // TODO make this cleaner. External files probably?
                    this.postStub.withArgs(sinon.match.has('url', sinon.match('https://plex.tv/pins.xml')))
                        .yields(null, {statusCode: 201}, '<?xml version="1.0" encoding="UTF-8"?>\
                    <pin>\
                      <client-identifier>7f5f9e38-4954-4243-9516-fb8dfdfb4e99</client-identifier>\
                      <code XXXXXUNPARSABLEXXXX>MOCA</code>\
                      <expires-at type="datetime">2015-11-14T23:58:40Z</expires-at>\
                      <id type="integer">12345678</id>\
                      <auth-token type="NilClass" nil="true"/>\
                      <auth_token nil="true"></auth_token>\
                    </pin>');
                });
            }

            it('should handle the plex server returning unparsable data', function(){
                var module = require('../index.js')();
                module.initialize(this.plexAPI);
                return expect(module.getNewPin()).to.be.rejected;
            });
        });

        describe("Plex server responds with unparsable PIN ID", function(){
            if (process.env.NODE_ENV !== 'test-live') {
                beforeEach('stub request.post to return successful data', function(){
                    // TODO make this cleaner. External files probably?
                    this.postStub.withArgs(sinon.match.has('url', sinon.match('https://plex.tv/pins.xml')))
                        .yields(null, {statusCode: 201}, '<?xml version="1.0" encoding="UTF-8"?>\
                    <pin>\
                      <client-identifier>7f5f9e38-4954-4243-9516-fb8dfdfb4e99</client-identifier>\
                      <code>MOCA</code>\
                      <expires-at type="datetime">2015-11-14T23:58:40Z</expires-at>\
                      <id type="integer"XXXXXUNPARSABLEXXXX>12345678</id>\
                      <auth-token type="NilClass" nil="true"/>\
                      <auth_token nil="true"></auth_token>\
                    </pin>');
                });
            }

            it('should handle the plex server returning unparsable data', function(){
                var module = require('../index.js')();
                module.initialize(this.plexAPI);
                return expect(module.getNewPin()).to.be.rejected;
            });
        });


        describe("Plex Server is not responding", function() {

            if (process.env.NODE_ENV !== 'test-live') {
                beforeEach('stub request.post to return successful data', function(){
                    this.postStub.yields(new Error('Server not responding'), {}, '');
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
                    this.postStub.yields(null, {statusCode: 404}, '');
                });

                it('should handle the Plex server giving unexpected response codes', function(){
                    var module = require('../index.js')();
                    module.initialize(this.plexAPI);
                    return expect(module.getNewPin()).to.be.rejected;
                });
            }
        });
    });

    describe("checkPinForAuth public method", function(){

        if (process.env.NODE_ENV !== 'test-live') {
            beforeEach('stub request.post to return successful data', function(){
                this.getStub = sinon.stub(request, 'get');
                this.getStub.withArgs(sinon.match.has('url', sinon.match('https://plex.tv/pins/12345678.xml')))
                    .yields(null, {statusCode: 201}, '<?xml version="1.0" encoding="UTF-8"?>\
                    <pin>\
                      <client-identifier>ccac6dd5-4fa7-47f9-88f7-ebafa6a32265</client-identifier>\
                      <code>MOCA</code>\
                      <expires-at type="datetime">2015-11-15T00:38:03Z</expires-at>\
                      <id type="integer">19627195</id>\
                      <auth-token type="NilClass" nil="true"/>\
                      <auth_token nil="true"></auth_token>\
                    </pin>');
                this.getStub.withArgs(sinon.match.has('url', sinon.match('https://plex.tv/pins/87654321.xml')))
                    .yields(null, {statusCode: 201}, '<?xml version="1.0" encoding="UTF-8"?>\
                    <pin>\
                      <client-identifier>282cd01f-aadf-4fc8-b01b-a6014f05f4e7</client-identifier>\
                      <code>MOCA</code>\
                      <expires-at type="datetime">2015-11-15T23:44:05Z</expires-at>\
                      <id type="integer">19673566</id>\
                      <auth-token type="NilClass">MOCHAAUTHTOKEN</auth-token>\
                      <auth_token>MOCHAAUTHTOKEN</auth_token>\
                    </pin>');
                this.getStub.withArgs(sinon.match.has('url', sinon.match('https://plex.tv/pins/99999999.xml')))
                    .yields(null, {statusCode: 404}, '');
                this.getStub.withArgs(sinon.match.has('url', sinon.match('https://plex.tv/pins/50000000.xml')))
                    .yields(null, {statusCode: 500}, '');
                this.getStub.withArgs(sinon.match.has('url', sinon.match('https://plex.tv/pins/88888888.xml')))
                    .yields(new Error('Fake error in HTTP request'));
            });

            afterEach('reset request stubs', function() {
                this.getStub.restore();
            });
        }

        it('should return "waiting" before auth has been granted', function(done){
            var module = require('../index.js')();
            module.initialize(this.plexAPI);
            module.checkPinForAuth('12345678', function(err, pinState){
                expect(pinState).to.equal('waiting');
                done();
            });
            //return expect(module.checkPinForAuth('12345678')).to.eventually.equal('String');
        });

        it('should return "authorized" after auth has been granted', function(done){
            var module = require('../index.js')();
            module.initialize(this.plexAPI);
            module.checkPinForAuth('87654321', function(err, pinState){
                expect(pinState).to.equal('authorized');
                done();
            });
            //return expect(module.checkPinForAuth('12345678')).to.eventually.equal('String');
        });

        it('should return "invalid" if the PIN is no longer valid', function(done){
            var module = require('../index.js')();
            module.initialize(this.plexAPI);
            module.checkPinForAuth('99999999', function(err, pinState){
                expect(pinState).to.equal('invalid');
                done();
            });
            //return expect(module.checkPinForAuth('12345678')).to.eventually.equal('String');
        });

        it('should handle a server error (status code 500)', function(done){
            var module = require('../index.js')();
            module.initialize(this.plexAPI);
            module.checkPinForAuth('50000000', function(err, pinState){
                expect(err).to.be.a('Error');
                done();
            });
            //return expect(module.checkPinForAuth('12345678')).to.eventually.equal('String');
        });

        it('should handle an HTTP error (sever timeout, etc)', function(done){
            var module = require('../index.js')();
            module.initialize(this.plexAPI);
            module.checkPinForAuth('88888888', function(err, pinState){
                expect(err).to.be.a('Error');
                done();
            });
            //return expect(module.checkPinForAuth('12345678')).to.eventually.equal('String');
        });

        it('should handle a PIN object as a parameter', function(done){
            var module = require('../index.js')();
            module.initialize(this.plexAPI);
            module.checkPinForAuth({code: 'ABCD', id: '12345678'}, function(err, pinState){
                expect(pinState).to.equal('waiting');
                done();
            });
            //return expect(module.checkPinForAuth('12345678')).to.eventually.equal('String');
        });
    });
});