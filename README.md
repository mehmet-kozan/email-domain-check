<div align="center"> 

# email-domain-check

**A comprehensive email domain validation library.** 
**Supports DNS, MX, SMTP, DKIM, DMARC, BIMI, TLSRPT, and MTA-STS.**  

</div> 

<div align="center">  

[![version](https://img.shields.io/npm/v/email-domain-check.svg)](https://www.npmjs.org/package/email-domain-check)
[![downloads](https://img.shields.io/npm/dt/email-domain-check.svg)](https://www.npmjs.org/package/email-domain-check)
[![node](https://img.shields.io/node/v/email-domain-check.svg)](https://nodejs.org/)  
[![tests](https://github.com/mehmet-kozan/email-domain-check/actions/workflows/test.yml/badge.svg)](https://github.com/mehmet-kozan/email-domain-check/actions/workflows/test.yml) 
[![tests](https://github.com/mehmet-kozan/email-domain-check/actions/workflows/test_integration.yml/badge.svg)](https://github.com/mehmet-kozan/email-domain-check/actions/workflows/test_integration.yml)
[![biome](https://img.shields.io/badge/code_style-biome-60a5fa?logo=biome)](https://biomejs.dev) 
[![vitest](https://img.shields.io/badge/tested_with-vitest-6E9F18?logo=vitest)](https://vitest.dev) 

</div>

<br />

## Features

-  MX record validation
-  SMTP server connection testing
-  DKIM record lookup
-  DMARC policy validation
-  MTA-STS support (RFC 8461)
-  IPv4/IPv6 support
-  Local IP blocking
-  DNS failover resolvers
-  Punycode/IDN support
-  TypeScript support

## Installation

```bash
npm install email-domain-check
# or
pnpm add email-domain-check
# or
yarn add email-domain-check
# or
bun add email-domain-check
```

## Usage (ESM / TypeScript)  

```ts
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
```

## Usage (CommonJS)

```js
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
```

## Advance Usage

#### Get Records
```ts
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
```

#### Get Authoritative Name Servers

```ts
import { DomainChecker } from "email-domain-check";
const checker = new DomainChecker();

// Get name servers
const nameServers = await checker.getNameServers("gmail.com");
console.log("Name Servers:", nameServers);


```

#### Get SMTP Connection
```ts
import { DomainChecker } from "email-domain-check";

const checker = new DomainChecker();
// Test or Get SMTP connection for mail sending
const socket = await checker.getSmtpConnection("user@example.com");
if (socket) {
  console.log("SMTP connection successful");
  socket.end();
}
```

#### MTA-STS Policy
```ts
import { getMtaStsPolicy, isMxAllowed } from "email-domain-check";

const policy = await getMtaStsPolicy("gmail.com");
if (policy) {
  console.log("MTA-STS Policy:", policy);
  // { version: 'STSv1', mode: 'enforce', mx: ['*.google.com'], max_age: 86400 }
  
  const allowed = isMxAllowed("alt1.gmail-smtp-in.l.google.com", policy);
  console.log("MX Allowed:", allowed);
}
```

#### Address Parsing and Validation
```ts
import {Address } from "email-domain-check";
// Address parsing and validation
const addr = Address.loadFromTarget("user@example.com");
console.log("Hostname:", addr.hostname); // example.com
console.log("User:", addr.user); // user
console.log("Is IP:", addr.isIP); // false
console.log("Is Local:", addr.isLocal); // false
console.log("Has Punycode:", addr.hasPunycode); // false

// Parse from URL
const url = new URL("https://example.com/path");
const urlAddr = Address.loadFromTarget(url);
console.log("From URL:", urlAddr.hostname); // example.com

// IP address validation
const Addr_01 = new Address("192.168.1.1");
console.log("Is Local IP:", Addr_01.isLocal); // true

const Addr_02 = new Address("8.8.8.8");
console.log("Is Local IP:", Addr_02.isLocal); // false
```

## API

### DomainChecker Class

#### Constructor Options

```ts
interface DomainCheckerOptions {
  server?: string[];            // Custom DNS servers
  dkimSelector?: string;        // Default: 'default'
  useCache?: boolean;           // Enable DNS caching
  cacheTTL?: number;            // Cache TTL in ms
  smtpTimeout?: number;         // Default: 10000
  dnsTimeout?: number;          // Default: 5000
  httpTimeout?: number;         // Default: 8000
  socketIdleTimeout?: number;   // RFC 5321 socket idle timeout
  useDomainNS?: boolean;        // Query domain's authoritative nameservers (Default: false)
  useMtaSts?: boolean;          // Enable MTA-STS related lookups (Default: false)
  ignoreIPv6?: boolean;         // Ignore IPv6 addresses
  tries?: number;               // Default: 3
  failoverServers?: string[][]; // Default: [['1.1.1.1','1.0.0.1'], ['8.8.8.8','8.8.4.4']]
  blockLocalIPs?: boolean;      // Block local/private IPs (Default: false)
  deliveryPort?: number;        // Default: 25
}
```

#### Methods

- `hasMxRecord(target: Target)` - Check if domain has MX records
- `getMxRecord(options: ResolveOptions)` - Get MX records
- `getSmtpConnection(target: Target)` - Test SMTP connection
- `getTxtRecord(options: ResolveOptions)` - Get all TXT records parsed
- `getSpfRecord(options: ResolveOptions)` - Get SPF record
- `getDkimRecord(options: ResolveOptions)` - Get DKIM record
- `getDmarcRecord(options: ResolveOptions)` - Get DMARC record
- `getStsRecord(options: ResolveOptions)` - Get MTA-STS record
- `getCustomRecords(options: ResolveOptions)` - Get custom TXT records
- `getCustomKVRecord(options: ResolveOptions, key: string)` - Get specific key-value record
- `getAllKVRecords(options: ResolveOptions)` - Get all key-value records
- `getNameServers(target: Target)` - Get authoritative name servers

### Address Class

#### Constructor

- `new Address(mailOrHost: string) - Create new Address instance`

```ts
import {Address } from "email-domain-check";
const addr_01 = new Address('user@gmail.com'); // string email or domain
const addr_02 = new Address('gmail.com'); 

```

#### Static Constructor Method

- `Address.loadFromTarget(target: string | URL | Address): Address` - Parse email/domain/URL

#### Properties

- `source: string` - Original input
- `hostname: string` - Domain name or IP
- `user?: string` - Email local part (if email)
- `ipKind: IPKind` - IP type (None, IPv4, IPv6)
- `isIP: boolean` - Is an IP address
- `isLocal: boolean` - Is local/private IP
- `hasPunycode: boolean` - Contains punycode



