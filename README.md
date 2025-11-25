# email-domain-check

[![version](https://img.shields.io/npm/v/email-domain-check.svg)](https://www.npmjs.org/package/email-domain-check)
[![downloads](https://img.shields.io/npm/dt/email-domain-check.svg)](https://www.npmjs.org/package/email-domain-check)
[![node](https://img.shields.io/node/v/email-domain-check.svg)](https://nodejs.org/)


## Installation

```bash
npm install email-domain-check
```

## Usage (ESM / TypeScript)

```ts
import { DomainChecker, Address } from "email-domain-check";

const dc = new DomainChecker(); // optional options object

// Check if domain/email has MX records (returns boolean)
const ok = await dc.hasMxRecord("user@example.com");
console.log(ok);

// Get MX records (returns array of { exchange, priority })
const mx = await dc.getMxRecord("example.com");
console.log(mx);

// Get authoritative name servers for a domain
const ns = await dc.getNameServers("example.com");
console.log(ns);

// You can also create Address objects from strings or URLs
const a1 = Address.loadFromTarget("user@example.com");
const a2 = Address.loadFromUrl("https://example.com/path");
console.log(a1.hostname, a2.hostname);
```

## Usage (CommonJS)

```js
const { DomainChecker } = require("email-domain-check");

const dc = new DomainChecker();

dc.hasMxRecord("user@example.com").then(console.log);
```

