const assert = require('assert');
const edc = require('../src/email-domain-check');

describe('general test', function() {
    // Zaman aşımını bu bloktaki tüm testler için 10 saniyeye çıkar
    this.timeout(10000);

    it('should false', async function() {
        const result = await edc("mehmet.kozan@gmailililil.com");
        assert.equal(result, false);
    });


    it('should true', function() {
        return edc("mehmet.kozan@gmail.com")
        .then(function(result){
            assert.equal(result,true);
        });
    });

});


