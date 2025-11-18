const assert = require('assert');
const edc = require('../');

describe('general test', function() {
    it('should false', function() {
        return edc("mehmet.kozan@gmailililil.com")
        .then(function(result){
            assert.equal(result,false);
        });
    });


    it('should true', function() {
        return edc("mehmet.kozan@gmail.com")
        .then(function(result){
            assert.equal(result,true);
        });
    });

});


