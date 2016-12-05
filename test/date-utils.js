let assert = require('assert');
let expect = require('expect');
let dateutils = require('../date');

describe('get full months between', function() {
    it ('edge case where d1 is in december and d2 is in january', function() {
        let d1 = '2016-12-19';
        let d2 = '2018-01-10';
        dateutils.getMonthsBetween(d1, d2)
        .then(function(result) {
            console.log(result);
            assert.equal(result.monthstart, '2017-01');
            assert.equal(result.monthend, '2017-12');
            expect(result.monthstart).toBe('2017-01');
            expect(result.monthend).toBe('2017-12');
        });
    });
});

describe('do something', function() {
    it ('do something', function() {
        let d1 = '2016-06-19';
        let d2 = '2018-05-10';
        dateutils.doSomething(d1, d2)
        .then(function(result) {
            console.log(result);
        });
    });
});
