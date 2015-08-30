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
    return requestPin().then(extractPin);
};

PinAuthenticator.prototype.checkPinForAuth = function checkPinForAuth(pin) {
    if (typeof(pin) == 'object') {
        pin = pin.id;
    }

    return requestAuthFromPin(pin).then(function(xmlBody) {

    });
};

function requestPin() {
    var deferred = Q.defer(); // TODO remove promises
    var options = {
        url: 'https://plex.tv/pins.xml',
        headers: headers(plexApi)
    };

    request.post(options, function(err, res, xmlBody) {
        if (err) {
            return deferred.reject(new Error('Error while requesting https://plex.tv for authentication: ' + String(err)));
        }
        if (res.statusCode !== 201) {
            return deferred.reject(new Error('Invalid status code in authentication response from Plex.tv, expected 201 but got ' + res.statusCode));
        }
        deferred.resolve(xmlBody);
    });

    return deferred.promise;
}

function requestAuthFromPin(pinId) {
    var deferred = Q.defer();
    var options = {
        url: 'https://plex.tv/pins/' + pinId + '.xml',
        headers: headers(plexApi)
    };

    // TODO how does this response work before auth is granted
    request.get(options, function(err, res, xmlBody) {
        if (err) {
            return deferred.reject(new Error('Error while requesting https://plex.tv for authentication: ' + String(err)));
        }
        if (res.statusCode !== 200) {
            return deferred.reject(new Error('Invalid status code in authentication response from Plex.tv, expected 201 but got ' + res.statusCode));
        }
        deferred.resolve(xmlBody);
    });

    return deferred.promise;
}

function extractAuthTokenFromPin(xmlBody) {
    var tokenMatches = xmlBody.match(rxAuthTokenFromPin);
    if (!tokenMatches) {
        throw new Error('Couldnt not find authentication token in the Pin response from Plex.tv');
    }
    return tokenMatches[1];
}

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