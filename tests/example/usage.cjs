const { DomainChecker } = require('email-domain-check');

async function run() {
	const checker = new DomainChecker();

	// Check if domain has MX records
	const hasMx = await checker.hasMxRecord('user@gmail.com');
	console.log('Has MX:', hasMx);

	// Get MX records with priority
	const mxRecords = await checker.getMxRecord({
		target: 'gmail.com', // string, URL or Address
		useCache: false,
		preferDomainNS: false, // use authoritative ns `ns1.google.com`
	});
	console.log('MX Records:', mxRecords);
	// [{ exchange: 'gmail-smtp-in.l.google.com', priority: 5 }]
}

run();
