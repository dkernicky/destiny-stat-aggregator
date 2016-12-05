let apis = require('./platform_apis');
let superagent = require('superagent');
let Promise = require('bluebird');
let dateUtils = require('./date');
let _ = require('lodash');
let logger = require('./logger')('index');

let name = 'Crimson_Wrath';
let membershipType = 2;

function getAccount(name) {
    return get(apis.getMembershipId(membershipType, name))
    .then(accounts => {
        logger.trace('Accounts: ' + accounts);
        return Promise.resolve(accounts[0].membershipId);
    });
}

function getCharacter(membershipId) {
    return get(apis.getItems(membershipType, membershipId))
    .then(result => {
        return Promise.resolve(result.data.characters.map((character) => {
            return {
                membershipId: character.characterBase.membershipId,
                characterId: character.characterBase.characterId,
                classType: character.characterBase.classType
            };
        }));
    })
}

function getActivityHistory(character, mode, dateStart, dateEnd) {
    console.log(mode);
    return get(apis.getActivityHistory(membershipType, character.membershipId, character.characterId, mode))
    .then(result => {
        console.log(JSON.stringify(result));
    });
}

function getAggregateActivityStats(character, mode, dateStart, dateEnd) {
    console.log(mode);
    return get(apis.getAggregateActivityStats(membershipType, character.membershipId, character.characterId, mode))
    .then(result => {
        console.log(JSON.stringify(result));
    });
}

function getStats(character, options) {
    let modeField = options.modes.charAt(0).toLowerCase() + options.modes.slice(1);
    let periodField = options.periodType.charAt(0).toLowerCase() + options.periodType.slice(1);
    return get(apis.getStats(membershipType, character.membershipId, character.characterId), options)
    .then(results => {
        // console.log(options);
        // console.log(results[modeField]);
        // console.log(results[modeField] === {});
        // console.log(results[modeField]);
        if (results[modeField][periodField.toLowerCase()]) {
            return Promise.resolve(results[modeField][periodField.toLowerCase()].map(result => {
                //console.log(result)
                return {
                    options: options,
                    games: result.values.activitiesEntered.basic.value,
                    wins: result.values.activitiesWon.basic.value,
                    kills: result.values.kills.basic.value,
                    deaths: result.values.deaths.basic.value,
                    assists: result.values.assists.basic.value
                }
            }));
        } else {
            return Promise.resolve([{
                options: options,
                games: 0,
                wins: 0,
                kills: 0,
                deaths: 0,
                assists: 0
            }]);
        }
    })
    .then(results => {
        if (results) {
            return Promise.resolve(results.reduce((a, b) => {
                return {
                    games: a.games + b.games,
                    wins: a.wins + b.wins,
                    kills: a.kills + b.kills,
                    deaths: a.deaths + b.deaths,
                    assists: a.assists + b.assists
                };
            }));
        }
    });
}

function get(f, q) {
    logger.trace('request url: ' + f);
    let query = q ? q : {};
    logger.trace('query: ' + JSON.stringify(query));
    return new Promise((resolve, reject) => {
        superagent
            .get(f)
            .query(query)
            .set('X-API-Key', '785fac597413481c82cba8446c87d31d')
            .end((err, res) => {
                if (err) {
                    console.log('err: ' + err);
                    reject(err);
                } else {
                    //console.log(res.header['x-selfurl']);
                    //console.log('done');
                    resolve(res.body.Response);
                }
            });
    });
}

// getAccount(`${name}`)
// .then(membershipId => {
//     console.log('membershipId: ' + membershipId);
//     //console.log(getCharacter(membershipId));
//     return getCharacter(membershipId);
// })
// .then((characters) => {
//     console.log('characterId\'s: ' + JSON.stringify(characters));
//     getStats(characters[0], options);
// });
let chars = [];

function getStatsForRange(dateStart, dateEnd, modes) {
    getAccount(`${name}`)
    .then(membershipId => {
        //console.log('membershipId: ' + membershipId);
        //console.log(getCharacter(membershipId));
        return getCharacter(membershipId);
    })
    .then((characters) => {
        chars = characters;
        return dateUtils.doSomething(dateStart, dateEnd);
    })
    .then(options => {
        return Promise.resolve(options.map(option => {
            option.modes = modes;
            return option;
        }));
    })
    .then(options => {
        let promises = [];
        _.forEach(options, option => {
            logger.debug('in for each');
            if (option !== {}) {
                promises.push(getStats(chars[0], option));
            }
        });
        return Promise.all(promises);
    })
    .then(result => {
        logger.debug(result);
        logger.trace('stats: ' + JSON.stringify(result));
        return Promise.resolve(result.reduce((a, b) => {
            // console.log('reducing: a' + JSON.stringify(a));
            // console.log('reducing: b' + JSON.stringify(b));

            return {
                games: a.games + b.games,
                wins: a.wins + b.wins,
                kills: a.kills + b.kills,
                deaths: a.deaths + b.deaths,
                assists: a.assists + b.assists
            };
        }));
    })
    .then(result => {
        console.log('done');
        console.log(result);
    });
}

getStatsForRange('2014-09-14', '2016-11-15', 'AllPvP');
logger.info('TESTING');
// let d1 = '2015-13-02';
// let date = new Date('2015-11-02');
// console.log(new Date(d1.substring(0, 4), d1.substring(5, 7), 0).getDate());
