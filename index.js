let stats = require('./fullstats');
let Promise = require('bluebird');
let logger = require('./logger')('index');


let names = ['Crimson_Wrath', 'P1mpag0n', 'YLOD_Express', 'russbluedevil44'];
let mode = 'IronBanner';
let dateStart = '2016-12-01';
let dateEnd = '2016-12-11';

stats.getStats(names, mode, dateStart, dateEnd)
.then(results => {
    logger.info(results);
})
