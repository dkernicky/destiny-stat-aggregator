const getStats = require('./stats');
const Table = require('cli-table');
const logger = require('./logger')('index');
const Promise = require('bluebird');
const _ = require('lodash');

//let name = 'Crimson_Wrath';
let fields = ['', 'wins', 'games', 'kills', 'deaths', 'assists', 'hunter-kd', 'hunter-kad', 'warlock-kd', 'warlock-kad', 'titan-kd', 'titan-kad', 'kd', 'kad', 'victory'];

var table = new Table();

table = new Table({ head: fields });


function getStatsByDisplayName(dateStart, dateEnd, mode, name) {
    return getStats(dateStart, dateEnd, mode, name)
    .then(overall => {
         logger.info(overall);
        // let stat = stats[0];
        // let arr = Object.keys(stat)
        // logger.info(arr);
        let data = {
            wins: '',
            games: '',
            kills: '',
            deaths: '',
            assists: '',
            'hunter-kd': '',
            'hunter-kad': '',
            'warlock-kd': '',
            'warlock-kad': '',
            'titan-kd': '',
            'titan-kad': '',
            kd: '',
            kad: '',
            victory: ''
        };
        _.forEach(overall, item => {
            if (item.character.classType === 0) {
                data['titan-kd'] = (item.kills/item.deaths).toString().substring(0, 4);
                data['titan-kad'] = ((item.kills+item.assists)/item.deaths).toString().substring(0, 4);
            }
            if (item.character.classType === 1) {
                data['hunter-kd'] = (item.kills/item.deaths).toString().substring(0, 4);
                data['hunter-kad'] = ((item.kills+item.assists)/item.deaths).toString().substring(0, 4);
            } else if (item.character.classType === 2) {
                data['warlock-kd'] = (item.kills/item.deaths).toString().substring(0, 4);
                data['warlock-kad'] = ((item.kills+item.assists)/item.deaths).toString().substring(0, 4);
            }
        })
        return Promise.all([
            Promise.resolve(data),
            Promise.resolve(overall.reduce((a, b) => {
                // console.log('a ' + JSON.stringify(a));
                // console.log('b ' + JSON.stringify(b));
                return {
                    wins: a.wins + b.wins,
                    games: a.games + b.games,
                    kills: a.kills + b.kills,
                    deaths: a.deaths + b.deaths,
                    assists: a.assists + b.assists
                };
            // data.wins = a.wins + b.wins;
            }))
        ]);
        //data.wins = 'fds';
        //console.log(data);
    })
    .then(obj => {
        obj[0].wins = obj[1].wins;
        obj[0].games = obj[1].games;
        obj[0].kills = obj[1].kills;
        obj[0].deaths = obj[1].deaths;
        obj[0].assists = obj[1].assists;

        obj[0].kd = (obj[0].kills / obj[0].deaths).toString().substring(0, 4);
        obj[0].kad = ((obj[0].kills + obj[0].assists) / obj[0].deaths).toString().substring(0, 4);
        obj[0].victory = (obj[0].wins / obj[0].games).toString().substring(0, 4);
        return Promise.resolve(obj[0]);
    })
    .then(result => {
        logger.info(result);

        let arr = Object.keys(result).map(key => {
                return result[key]

        });
        let obj = {};
        obj[name] = arr;

        table.push(
            obj
        );

        //console.log(table.toString());
        return Promise.resolve(table);
    });
}

function getStatsMultiple(dateStart, dateEnd, modes, names) {
    let promises = [];
    _.forEach(names, name => {
        promises.push(getStatsByDisplayName(dateStart, dateEnd, modes, name));
    });
    return Promise.all(promises)
    .then(result => {
        console.log(table.toString());
        console.log('Now Im done');
    });
}

getStatsMultiple('2016-12-02', '2016-12-10', 'IronBanner', ['Crimson_Wrath','P1mpag0n','YLOD_Express', 'russbluedevil44']);
