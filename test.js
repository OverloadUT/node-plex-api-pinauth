const PlexPin = require('./index');
const Plex = require('plex-api');


/*
 * CONFIG
 */
let plexIp = '192.168.178.5';

const plexClient = new Plex(plexIp);
const plexPin = new PlexPin(plexClient);

/*
 *
 */
/*
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
*/


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
