let stats = require('./fullstats');
let Promise = require('bluebird');
let logger = require('./logger')('index');
const Table = require('cli-table');



let names = ['Crimson_Wrath', 'P1mpag0n', 'YLOD_Express', 'russbluedevil44'];
//names = ['Crimson_Wrath'];
let mode = 'IronBanner';
mode = 'PrivateMatchesAll'
let dateStart = '2016-12-20';
// dateStart = '2016-12-01';
let dateEnd = '2016-12-31';

let fields1 = ['games', 'wins', 'kills', 'deaths', 'assists', 'hkd', 'hkad', 'wkd', 'wkad', 'tkd', 'tkad', 'kd', 'kad', 'victory'];
let fields2 = ['spg', 'kpg', 'avgCombatRating', 'longestLife', 'longestSpree', 'avgPlace', 'precision'];

let table1 = new Table();
table1 = new Table({ head: [''].concat(fields1) });
let table2 = new Table();
table2 = new Table({ head: [''].concat(fields2) });
let table3 = new Table();
table3 = new Table({ head: [`${mode} stats from ${dateStart} to ${dateEnd}`]});

stats.getStats(names, mode, dateStart, dateEnd)
.then(results => {
    //logger.info(results);
    results.forEach(result => {
        logger.info(result);
        let arr = [ result[1].games,  result[1].standing, result[1].kills, result[1].deaths, result[1].assists,
            result[0].hunterKd, result[0].hunterKad, result[0].warlockKd, result[0].warlockKad, result[0].titanKd, result[0].titanKad ];
        arr.push((result[1].kills/result[1].deaths).toString().substring(0, 5));
        arr.push(((result[1].kills+result[1].assists)/result[1].deaths).toString().substring(0, 5));
        arr.push((result[1].standing/result[1].games).toString().substring(0, 5));
        let obj = {};
        obj[result[1].name] = arr;
        table1.push(obj);

        arr = [ ];
        arr.push((result[1].score/result[1].games).toString().substring(0, 5));
        arr.push((result[1].kills/result[1].games).toString().substring(0, 5));
        arr.push((result[1].combatRating/result[1].games).toString().substring(0, 6));
        arr.push(result[1].longestSingleLife);
        arr.push(result[1].longestKillSpree)
        arr.push((result[1].place/result[1].games).toString().substring(0, 5));
        arr.push((result[1].precisionKills/result[1].kills).toString().substring(0, 5));
        obj = {};
        obj[result[1].name] = arr;
        table2.push(obj);
    })

    console.log(table3.toString());
    console.log(table1.toString());
    console.log(table2.toString())
})






//table.push(':)')
