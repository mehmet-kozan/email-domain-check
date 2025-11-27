import { DomainChecker } from 'email-domain-check';

const checker = new DomainChecker();

// Get SPF record
const spf = await checker.getSpfRecord({
	target: 'mehmet.kozan@cambly.com',
	dkimSelector: 'k1',
});
console.log('SPF:', spf);

// Get DKIM record
const dkim = await checker.getDkimRecord({
	target: 'mehmet.kozan@cambly.com',
	dkimSelector: 'k1',
});
console.log('DKIM:', dkim);

// Get DMARC record
const dmarc = await checker.getDmarcRecord({
	target: 'gmail.com',
});
console.log('DMARC:', dmarc);

// Get MTA-STS record
const sts = await checker.getStsRecord({
	target: 'user@gmail.com',
});
console.log('MTA-STS:', sts);

// Get custom records
const customRecords = await checker.getCustomRecords({
	target: 'user@gmail.com',
});
console.log('Custom Records:', customRecords);

// Get custom kv record
const kvRecord = await checker.getCustomKVRecord(
	{
		target: 'user@gmail.com',
	},
	'yahoo-verification-key',
);
console.log('KV Record:', kvRecord);

// Get custom kv record
const allKVRecord = await checker.getAllKVRecords({
	target: 'user@gmail.com',
});
console.log('All KV Records:', allKVRecord);
