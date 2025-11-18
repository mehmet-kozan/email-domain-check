const dnscache = require('dnscache');
const co = require('co');

function dns_checker(email,options){
    return new Promise((resolve, reject) =>
    {
        options = options || {enable: true, ttl: 300, cachesize: 10000};
        const dns = dnscache(options);
        const domain = email.split('@')[1];

        dns.resolveMx(domain, (error, addresses) =>
        {
            if(error)
            {
                return reject(false);
            }

            return resolve(addresses.length > 0);
        });
    })
    .then(result=>result)
    .catch(err=>false);
}

module.exports  = dns_checker;


//for testing purpose
if (!module.parent) 
{
    let testing_purpose = co.wrap(function* (){
        let res_didYouMean = yield dns_checker("mehmet.kozan@hotmalilili.com");
        debugger;

        let res_syntaxCheck = yield dns_checker("mehmet.kozan@hotmali.com");
        debugger;

    });

    testing_purpose();
}