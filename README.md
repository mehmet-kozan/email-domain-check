# email-domain-check
> **Checks existence of E-Mail DNS MX records.**

![logo](https://assets.gitlab-static.net/uploads/-/system/project/avatar/4802372/email-domain-check.png)

[![version](https://img.shields.io/npm/v/email-domain-check.svg)](https://www.npmjs.org/package/email-domain-check)
[![downloads](https://img.shields.io/npm/dt/email-domain-check.svg)](https://www.npmjs.org/package/email-domain-check)
[![node](https://img.shields.io/node/v/email-domain-check.svg)](https://nodejs.org/)
[![status](https://gitlab.com/autokent/email-domain-check/badges/master/pipeline.svg)](https://gitlab.com/autokent/email-domain-check/pipelines)

## Installation
`npm install email-domain-check`

## Usage
```js
const edc = require('email-domain-check');

edc("tom@hotmail.com").then(function(result){
    console.log(result);//true
})

edc("tom@hotmaililililcom").then(function(result){
    console.log(result);//false
})

```


## Test
`mocha` or `npm test`

> check test folder and QUICKSTART.js for extra usage.