let logger = require('./logger')('fullstats');
let apis = require('./platform_apis');
let superagent = require('superagent');
let Promise = require('bluebird');

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
                    resolve(res.body.Response);
                }
            });
    });
}

function getActivityHistory(playerData, mode) {
    let promises = [];

    playerData.characters.forEach(character => {
        let options = {
            count: 100,
            page: 0,
            mode: mode
        };
        let activities = [];
        promises.push(getCharacterActivities(activities, playerData.account.membershipType, playerData.account.membershipId, character.characterId, options))
    })
    return Promise.all(promises);
}

function getCharacterActivities(activities, membershipType, membershipId, characterId, options) {
    return get(apis.getActivityHistory(membershipType, membershipId, characterId), options)
    .then(results => {
        options.page += 1;
        if (results.data.activities) {

            activities = activities.concat(results.data.activities);
            return getCharacterActivities(activities, membershipType, membershipId, characterId, options);
        } else {
            logger.info(activities.length);
            let promises = [];
            activities.forEach(activity => {
                promises.push(addPostGameCarnage(characterId, activity, activity.activityDetails.instanceId));
            });
            return Promise.all(promises)
            .then(activities => {
                // logger.trace(activities.length + ':)');
                //logger.trace(activities);
                return reduce(activities)
            });
        }
    });
}

function reduce(activities) {
    activities = activities.reduce((a, b) => {
        let spree = Math.max(a.longestKillSpree, b.longestKillSpree);
        let life = Math.max(a.longestSingleLife, b.longestSingleLife);
        let medals = {};
        for (aMedals in a.medals) {
            if (b.medals[aMedals]) {
                medals[aMedals] = a.medals[aMedals] + b.medals[aMedals];
            } else {
                medals[aMedals] = a.medals[aMedals];
            }
        }
        for (bMedals in b.medals) {
            if (!a.medals[bMedals]) {
                medals[bMedals] = b.medals[bMedals];
            }
        }
        return {
            kills: a.kills + b.kills,
            deaths: a.deaths + b.deaths,
            score: a.score + b.score,
            precisionKills: a.precisionKills + b.precisionKills,
            longestKillSpree: spree,
            longestSingleLife: life,
            combatRating: a.combatRating + b.combatRating,
            place: a.place + b.place,
            games: a.games + b.games,
            medals: medals
        }
    })
    return Promise.resolve(activities)
}

function addPostGameCarnage(characterId, activity, activityId) {
    return get(apis.getCarnage(activityId))
    .then(result => {
        return Promise.resolve({
            period: activity.period,
            activityDetails: activity.activityDetails, // ref id, instance id, mode, type hash override, isprivate
            values: activity.values,
            entries: result.data.entries, // all player data
            teams: result.data.teams
        });
    })
    .then(result => {

        return getPostGameAdvancedMetrics(characterId, result);
    });
}

function getPostGameAdvancedMetrics(characterId, activity) {
    // medals = activity.entries[n].extended.values
    // weapons = activity.entries[n].extended.Weapons
    let promises = [];
    promises.push(getPlace(characterId, activity));
    promises.push(getOtherStats(characterId, activity));
    return Promise.all(promises)
    .then(result => {
        result[1].place = result[0];
        return Promise.resolve(result[1]);
    })
    // .then(result => {
    //     // kills: 14,
    //     // deaths: 13,
    //     // score: 2750,
    //     // precisionKills: 9,
    //     // longestKillSpree: 5,
    //     // longestSingleLife: 90,
    //     // combatRating: 103.57954114397154,
    //     // weaponBestType: 'Sniper Rifle',
    //     // medals: [Object],
    //     // place: 2
    //
    //     logger.info(result)
    //     return Promise.resolve(result.reduce((a, b) => {
    //         let spree = a.longestKillSpree < b.longestKillSpree ? a.longestKillSpree : b.longestKillSpree;
    //         let life = Math.max(a.longestSingleLife, b.longestSingleLife);
    //         return {
    //             kills: a.kills + b.kills,
    //             deaths: a.deaths + b.deaths,
    //             score: a.score + b.score,
    //             precisionKills: a.precisionKills + b.precisionKills,
    //             longestKillSpree: spree,
    //             longestSingleLife: life,
    //             combatRating: a.combatRating + b.combatRating,
    //             place: a.place + b.place
    //         }
    //     }));
    // });
}

function analyzePerCharacterStats(activities) {
    //logger.info(data);
    logger.info(activities);
}

function getOtherStats(characterId, activity) {
    //logger.info(activity.entries)
    let values = activity.entries.find(entry => {
        return entry.characterId === characterId;
    }).extended.values;
    //logger.debug(values);
    let stats = {
        // totalKillDistance: values.totalKillDistance.basic.value || null,
        // kills: values.kills.basic.value,
        // deaths: values.deaths.basic.value,
        // score: values.score.basic.value,
        // precisionKills: values.precisionKills.basic.value,
        // longestKillSpree: values.longestKillSpree.basic.value,
        // longestSingleLife: values.longestSingleLife.basic.value, //seconds
        // combatRating: values.combatRating.basic.value,
        // weaponBestType: values.weaponBestType.basic.displayValue,
        //weaponKillsSuper: val.extended.values.weaponKillsSuper.basic.displayValue,

        totalKillDistance: '',
        kills: '',
        deaths: '',
        score: '',
        precisionKills: '',
        longestKillSpree: '',
        longestSingleLife: '', //seconds
        combatRating: '',
        weaponBestType: ''

    }
    for (key in stats) {
        if (key === 'weaponBestType') {
            stats[key] = values[key] ? values[key].basic.displayValue : null;
        } else {
            stats[key] = values[key] ? values[key].basic.value : null;
        }
    }
    stats.games = 1;
    stats.medals = {};

    for (key in values) {
        //logger.warn('BEFORE' + item);
        if (key.indexOf('medal') !== -1) {
            stats.medals[key] = values[key].basic.value;
        }
    }
    // logger.error('AFTER');
    // logger.error(medals);
    //logger.error(stats);
    return Promise.resolve(stats);
    //logger.info(val.extended.values)
}

function getWeapons(characterId, activity) {
}

function getPlace(characterId, activity) {
    return Promise.resolve(activity.entries.sort((a, b) => {
        if (a.score.basic.value > b.score.basic.value) {
            return -1;
        } else if (a.score.basic.value < b.score.basic.value) {
            return 1;
        } else {
            return 0;
        }
    }))
    .then(result => {
        return Promise.resolve(result.findIndex((item, i) => {
            return item.characterId === characterId;
        }) + 1);
    })
}

function getAccount(name) {
    let membershipType = '2';
    logger.info('Getting account info for: ' + name);
    return get(apis.getMembershipId(membershipType, name))
    .then(accounts => {
        logger.trace('Accounts: ' + JSON.stringify(accounts));
        return Promise.resolve({
            membershipId: accounts[0].membershipId,
            membershipType: accounts[0].membershipType,
            displayName: name
        });
    });
}

function getCharacter(membershipInfo) {
    return get(apis.getItems(membershipInfo.membershipType, membershipInfo.membershipId))
    .then(result => {
        return Promise.resolve({
            account: membershipInfo,
            characters: result.data.characters.map((character) => {
                return {
                    characterId: character.characterBase.characterId,
                    classType: character.characterBase.classType
                };
            })
        });
    })
}

function getPlayerInfo(name) {
    return getAccount(name)
    .then(getCharacter);
}

function entry() {
    let name = 'Crimson_Wrath';
    let mode = 'TrialsOfOsiris';
    mode = 'AllPvP';
    mode = 'Lockdown';
    getPlayerInfo(name)
    .then((result) => {
        return getActivityHistory(result, mode);
    })
    .then(result => {
        return analyzePerCharacterStats(result);
        //logger.warn(result);
        //logger.debug(result[0][0]);
        //logger.debug(result[0][3].values.standing);

    });
}
entry();
