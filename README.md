<div align="center"> 

# email-domain-check

**A comprehensive email domain validation library.** 
**Supports DNS, MX, SMTP, DKIM, DMARC, and MTA-STS.**  

</div> 

<div align="center">  

[![version](https://img.shields.io/npm/v/email-domain-check.svg)](https://www.npmjs.org/package/email-domain-check)
[![downloads](https://img.shields.io/npm/dt/email-domain-check.svg)](https://www.npmjs.org/package/email-domain-check)
[![node](https://img.shields.io/node/v/email-domain-check.svg)](https://nodejs.org/)  

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
import { DomainChecker, Address } from "email-domain-check";

const checker = new DomainChecker();

// Check if domain has MX records
const hasMx = await checker.hasMxRecord("user@example.com");
console.log("Has MX:", hasMx);

// Get MX records with priority
const mxRecords = await checker.getMxRecord({
  target: "example.com",
  useCache: false,
  preferDomainNS: false
});
console.log("MX Records:", mxRecords);
// [{ exchange: 'mail.example.com', priority: 10 }]

// Test SMTP connection
const socket = await checker.getSmtpConnection("user@example.com");
if (socket) {
  console.log("SMTP connection successful");
  socket.end();
}

// Get DKIM record
const dkim = await checker.getDkimRecord({
  target: "example.com",
  selector: "default"
});
console.log("DKIM:", dkim?.records);

// Get DMARC policy
const dmarc = await checker.getDmarcRecord({
  target: "example.com"
});
console.log("DMARC:", dmarc?.records);

// Get MTA-STS DNS record
const mtaSts = await checker.getMtaStsRecord({
  target: "example.com"
});
console.log("MTA-STS ID:", mtaSts?.getSTSPolicyId());

// Get MTA-STS policy file
import { getMtaStsPolicy, isMxAllowed } from "email-domain-check/mta-sts";

const policy = await getMtaStsPolicy("gmail.com");
if (policy) {
  console.log("MTA-STS Policy:", policy);
  // { version: 'STSv1', mode: 'enforce', mx: ['*.google.com'], max_age: 86400 }
  
  const allowed = isMxAllowed("alt1.gmail-smtp-in.l.google.com", policy);
  console.log("MX Allowed:", allowed);
}

// Get name servers
const nameServers = await checker.getNameServers("example.com");
console.log("Name Servers:", nameServers);

// Address parsing and validation
const addr = Address.loadFromTarget("user@example.com");
console.log("Hostname:", addr.hostname); // example.com
console.log("User:", addr.user); // user
console.log("Is IP:", addr.isIP); // false
console.log("Is Local:", addr.isLocal); // false
console.log("Has Punycode:", addr.hasPunycode); // false

// Parse from URL
const urlAddr = Address.loadFromUrl("https://example.com/path");
console.log("From URL:", urlAddr.hostname); // example.com

// IP address validation
const ipAddr = new Address("192.168.1.1");
console.log("Is Local IP:", ipAddr.isLocal); // true

const publicIp = new Address("8.8.8.8");
console.log("Is Public IP:", !publicIp.isLocal); // true
```

## Usage (CommonJS)

```js
const { DomainChecker } = require("email-domain-check");

const checker = new DomainChecker();

// Check MX records
checker.hasMxRecord("user@example.com").then(result => {
  console.log("Has MX:", result);
});

// Get MX records
checker.getMxRecord({ target: "example.com" }).then(records => {
  console.log("MX Records:", records);
});

// Test SMTP connection
checker.getSmtpConnection("user@example.com").then(socket => {
  if (socket) {
    console.log("Connected to SMTP server");
    socket.end();
  }
}).catch(error => {
  console.error("Connection failed:", error.message);
});
```

## API

### DomainChecker

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

- `hasMxRecord(target: Target): Promise<boolean>` - Check if domain has MX records
- `getMxRecord(options: ResolveOptions): Promise<MxRecord[]>` - Get MX records
- `getSmtpConnection(target: Target): Promise<Socket | null>` - Test SMTP connection
- `getDkimRecord(options: ResolveOptions): Promise<TXTResult | null>` - Get DKIM record
- `getDmarcRecord(options: ResolveOptions): Promise<TXTResult | null>` - Get DMARC record
- `getMtaStsRecord(options: ResolveOptions): Promise<TXTResult | null>` - Get MTA-STS DNS record
- `getTxtRecord(options: ResolveOptions): Promise<TXTResult | null>` - Get any TXT record
- `getNameServers(target: Target): Promise<string[]>` - Get authoritative name servers

### Address

#### Static Methods

- `Address.loadFromTarget(target: string | Address): Address` - Parse email/domain

#### Properties

- `source: string` - Original input
- `hostname: string` - Domain name or IP
- `user?: string` - Email local part (if email)
- `ipKind: IPKind` - IP type (None, IPv4, IPv6)
- `isIP: boolean` - Is an IP address
- `isLocal: boolean` - Is local/private IP
- `hasPunycode: boolean` - Contains punycode

### MTA-STS

```ts
import { getMtaStsPolicy, isMxAllowed } from "email-domain-check";

// Get MTA-STS policy from https://mta-sts.{domain}/.well-known/mta-sts.txt
const policy = await getMtaStsPolicy("example.com");

// Check if MX host is allowed by policy
const allowed = isMxAllowed("mail.example.com", policy);
```


