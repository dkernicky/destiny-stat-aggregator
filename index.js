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
//let chars = [];

function getBetterStats(character, options, mode) {
    logger.trace('getStats ENTER');
    options.modes = mode;

    let modeField = options.modes.charAt(0).toLowerCase() + options.modes.slice(1);
    let periodField = options.periodType.charAt(0).toLowerCase() + options.periodType.slice(1);
    return get(apis.getStats(membershipType, character.membershipId, character.characterId), options)
    .then(results => {
        //logger.trace(`raw results for ${JSON.stringify(options)}: ${JSON.stringify(results)}`);
        logger.trace(options);
        //logger.trace(results);
        if (results[modeField][periodField.toLowerCase()]) {
            logger.debug(results[modeField][periodField.toLowerCase()]);
            return Promise.resolve(results[modeField][periodField.toLowerCase()].map(result => {
                //console.log(result)
                return {
                    character: character,
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
                character: character,
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
                    character: character,
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

function getCharacterStats(character, periodData, modes) {
    let promises = [];
    _.forEach(periodData, period => {
        promises.push(getBetterStats(character, period, modes));
    });
    return Promise.all(promises)
    .then(stats => {
        return Promise.resolve(stats.reduce((a, b) => {
            return {
                character: character,
                games: a.games + b.games,
                wins: a.wins + b.wins,
                kills: a.kills + b.kills,
                deaths: a.deaths + b.deaths,
                assists: a.assists + b.assists
            };
        }));
    });
}

function betterStats(dateStart, dateEnd, modes) {
    // get account array
    let chars = [];
    // let name = `${name}`;
    getAccount(`${name}`)
    .then(getCharacter)
    .then(characterData => {
        chars = characterData;
        return dateUtils.doSomething(dateStart, dateEnd);
    })
    .then(periodData => {
        let promises = [];
        _.forEach(chars, character => {
            promises.push(getCharacterStats(character, periodData, modes));
        });
        return Promise.all(promises);
    })
    .then()
    // .then(result => {
    //     return Promise.resolve(result.reduce((a, b) => {
    //         return {
    //             games: a.games + b.games,
    //             wins: a.wins + b.wins,
    //             kills: a.kills + b.kills,
    //             deaths: a.deaths + b.deaths,
    //             assists: a.assists + b.assists
    //         };
    //     }));
    // })
    .then(result => {
        logger.info('done');
        logger.info(result);

    })
}



// getStatsForRange('2014-09-14', '2016-11-15', 'AllPvP');
betterStats('2014-09-14', '2016-11-15', 'AllPvP');
// logger.info('TESTING');
// let d1 = '2015-13-02';
// let date = new Date('2015-11-02');
// console.log(new Date(d1.substring(0, 4), d1.substring(5, 7), 0).getDate());
