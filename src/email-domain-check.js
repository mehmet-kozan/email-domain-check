const dns = require('dns').promises; // Promise tabanlı API'yi kullan

async function dns_checker(email, options) {
    try {
        // options parametresi dnscache için kullanılıyordu, standart dns modülünde doğrudan bu şekilde kullanılmaz.
        // Ancak dns.setServers gibi ayarlamalar yapılabilir.
        
        const domain = email.split('@')[1];
        
        // resolveMx doğrudan bir Promise döner
        const addresses = await dns.resolveMx(domain);
        
        return addresses && addresses.length > 0;

    } catch (err) {
        return false;
    }
}

module.exports = dns_checker;