'use strict';

var request = require('request');
var headers = require('plex-api-headers');
var Q = require('q');

var rxPinCode = /<code>([A-Z0-9]+)<\/code>/i;
var rxPinID = /<id type="integer">([0-9]+)<\/id>/i;
var rxAuthTokenFromPin = /<auth_token>([0-9A-Z]+)<\/auth_token>/i;

function PinAuthenticator(token) {
    this.token = token;
}

PinAuthenticator.prototype.authenticate = function authenticate(plexApi, callback) {
    if (typeof plexApi !== 'object') {
        throw new TypeError('First argument should be the plex-api object to perform authentication for');
    }
    if (typeof callback !== 'function') {
        throw new TypeError('Second argument should be a callback function to be called when authentication has finished');
    }

    if(!this.token) {
        return callback(new Error('User has not authenticated yet'))
    }

    callback(null, this.token);
};

PinAuthenticator.prototype.initialize = function initialize(plexApi) {
    this.plexApi = plexApi;
};

PinAuthenticator.prototype.getNewPin = function getNewPin() {
    return requestPin(this.plexApi).then(extractPin);
};

// Resolves with a string representing the current state of the provided PIN
// 'authorized': the PIN has been granted auth, and we have a token and are ready to go!
// 'waiting': the PIN has not been granted auth yet
// 'invalid': the PIN is no longer valid
// TODO I hate pretty much everything about this - strings to represent state, the way it gets data from requestAuthFromPin, etc. There's got to be a better way.
// TODO this uses a callback, but getNewPin uses a promise. Pick one! OR support both?
PinAuthenticator.prototype.checkPinForAuth = function checkPinForAuth(pin, callback) {
    if (typeof(pin) == 'object') {
        pin = pin.id;
    }

    var self = this;
    requestAuthFromPin(this.plexApi, pin).then(function(authResponse){
        if(authResponse === '404') {
            callback(null, 'invalid');
        } else {
            var token = extractAuthToken(authResponse);
            if (token) {
                self.token = token;
                callback(null, 'authorized');
            } else {
                callback(null, 'waiting');
            }
        }
    }).catch(function(error){
        callback(new Error('Error in requestAuthFromPin', error));
    });
};

function requestPin(plexApi) {
    var deferred = Q.defer(); // TODO remove promises
    var options = {
        url: 'https://plex.tv/pins.xml',
        headers: headers(plexApi)
    };

    request.post(options, function(err, res, xmlBody) {
        if (err) {
            return deferred.reject(new Error('Error while requesting plex.tv for a new pin: ' + String(err)));
        }
        if (res.statusCode !== 201) {
            return deferred.reject(new Error('Tried to request a PIN from plex.tv, but got an unexpected status code: expected 201 but got ' + res.statusCode));
        }
        deferred.resolve(xmlBody);
    });

    return deferred.promise;
}

// Resolves with either the XML body, or a string '404'
function requestAuthFromPin(plexApi, pinId) {
    var deferred = Q.defer();
    var options = {
        url: 'https://plex.tv/pins/' + pinId + '.xml',
        headers: headers(plexApi)
    };

    var response = {};

    // 404: Not a valid PIN (or expired)
    request.get(options, function(err, res, xmlBody) {
        if (err) {
            return deferred.reject(new Error('Error while checking the PIN for authentication via plex.tv: ' + String(err)));
        }
        if (res.statusCode === 404) {
            return deferred.resolve('404');
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
            return deferred.reject(new Error('Invalid status code in authentication response from Plex.tv, expected 201 but got ' + res.statusCode));
        }
        return deferred.resolve(xmlBody);
    });

    return deferred.promise;
}

function extractAuthToken(xmlBody) {
    var tokenMatches = xmlBody.match(rxAuthTokenFromPin);
    if (!tokenMatches) {
        return false;
    }
    return tokenMatches[1];
}

// TODO this function throws (because promises) but the extractAuthToken returns false if it can't find a match
// It should be consistent
function extractPin(xmlBody) {
    var pinCodeMatches = xmlBody.match(rxPinCode);
    if (!pinCodeMatches) {
        throw new Error('Couldnt not find Pin Code response from Plex.tv :(');
    }

    var pinIdMatches = xmlBody.match(rxPinID);
    if (!pinIdMatches) {
        throw new Error('Couldnt not find Pin ID in response from Plex.tv :(');
    }

    return {
        code: pinCodeMatches[1],
        id: pinIdMatches[1]
    }
}

module.exports = function(options) {
    options = options || {};
    var token = options.token || null;

    return new PinAuthenticator(token);
};