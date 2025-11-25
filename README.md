# email-domain-check
> **Checks existence of E-Mail DNS MX records.**


[![version](https://img.shields.io/npm/v/email-domain-check.svg)](https://www.npmjs.org/package/email-domain-check)
[![downloads](https://img.shields.io/npm/dt/email-domain-check.svg)](https://www.npmjs.org/package/email-domain-check)
[![node](https://img.shields.io/node/v/email-domain-check.svg)](https://nodejs.org/)


## Installation
`npm install email-domain-check`

## Usage
```js
const {mxCheck} = require('email-domain-check');

mxCheck("tom@hotmail.com").then(function(result){
    console.log(result);//true
})

mxCheck("tom@hotmaililililcom").then(function(result){
    console.log(result);//false
})

```
