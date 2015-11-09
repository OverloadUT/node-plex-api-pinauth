var expect = require('chai').expect;
var sinon = require('sinon');

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
});