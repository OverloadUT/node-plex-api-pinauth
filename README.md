# node-plex-api-pinauth
An authentication module for [node-plex-api](https://github.com/phillipj/node-plex-api) that handles the API requests necessary for getting an auth token using a PIN.


## Usage

The following code retrieves a PIN and waits for the user to enter the PIN on plex.tv so a token can be retrieved.
A PIN is valid for 15 minutes and after that this script will timeout.

```js
const PlexPin = require('./index');
const Plex = require('plex-api');


/*
 * CONFIG
 */
let plexIp = '192.168.0.5';

const plexClient = new Plex(plexIp);
const plexPin = new PlexPin(plexClient);


/*
 * Get a PIN
 */
plexPin.getPin().then(pin =>
{
	// print pin
	console.log(pin.code);
	
	// get token
	let ping = setTimeout(function pollToken()
	{
		plexPin.getToken(pin.id)
			.then(res =>
			{
				// success getting token
				if (res.token === true)
				{
					console.log(res['auth-token']);
					return;
				}
				
				// failed getting token
				else if (res.token === false)
				{
					console.error('Timeout!');
					return;
				}
				
				// polling
				else
					ping = setTimeout(pollToken, 1000);
			})
			.catch(err => console.error(JSON.stringify(err)));
		
	}, 2000);
})
.catch(err => console.error(err.message));
```

If you only wish to verify a PIN, use the following script:

```js
plexPin.getToken(6566262696).then(res => // fake PIN
{
	// success getting token
	if (res.token === true)
		console.log(res['auth-token']);
	
	// failed getting token
	else if (res.token === false)
		console.error('Timeout!');
	
	// polling
	else
		console.error('No token found!');
})
.catch(err => console.error(err.message));
```
