import { Address, DomainChecker } from 'email-domain-check';

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

// use url, domain or email
const url = new URL('https://gmail.com');
const addr_01 = Address.loadFromTarget(url);
const addr_02 = Address.loadFromTarget('gmail.com');
const addr_03 = Address.loadFromTarget('user@gmail.com');
const addr_04 = new Address('mehmet.kozan@gmail.com'); // email or domain

console.log('Has MX 01:', await checker.hasMxRecord(addr_01));
console.log('Has MX 02:', await checker.hasMxRecord(addr_02));
console.log('Has MX 03:', await checker.hasMxRecord(addr_03));
console.log('Has MX 04:', await checker.hasMxRecord(addr_04));
// or direct use
console.log('Has MX 05:', await checker.hasMxRecord(new URL('https://gmail.com')));
console.log('Has MX 06:', await checker.hasMxRecord('gmail.com'));
console.log('Has MX 07:', await checker.hasMxRecord('user@gmail.com'));
console.log('Has MX 08:', await checker.hasMxRecord('mehmet.kozan@gmail.com'));
