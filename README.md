# node-plex-api-pinauth
An authentication module for [node-plex-api](https://github.com/phillipj/node-plex-api) that handles the API requests necessary for getting an auth token using a PIN.

## No Longer Maintained
I am no longer maintaining this repo. However, Zefau has been doing some recent development over on this fork, so head on over there: https://github.com/Zefau/node-plex-api-pinauth

## Current State
It's usable, but it's ugly. One of the public methods returns a promise while the other uses a callback. That's dumb.
There are other dumb things too that need to be cleaned up.
 
But it works!

## Usage
```js
var plexApi = require('plex-api');
var plexPinAuth = require('plex-api-pinauth')();

var plexClient = new PlexAPI({
    hostname: '192.168.0.1',
    authenticator: plexPinAuth
});

// Use getNewPin to get a new PIN object with these parameters:
// code: The 4-digit PIN that the user should enter on https://plex.tv/pin to grant authorization
// id: the ID of the PIN, which you'll need to use when checking if we have authorization yet
plexPinAuth.getNewPin().then(function(pinObj){
    console.log(pinObj)
    // {code: 'ABCD', id: '12345678'}
});

// Use checkPinForAuth to check to see if the user has entered the PIN on the website yet.
// returns a string representing 3 possible results:
// "authorized": The user has granted authorization and we now have the token. You can use plexClient now.
// "waiting": The user has not yet granted authorization.
// "invalid": The PIN is no longer (or never was) valid. PINs only remain valid for about 10 minutes.
plexPinAuth.checkPinForAuth(pinObj, function callback(err, status) {
    if(err) {
        // uh oh
    } else {
        console.log(status);
        // "authorized"
    }
});
```
