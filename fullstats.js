let logger = require('./logger')('fullstats');
let apis = require('./platform_apis');
let superagent = require('superagent');
let Promise = require('bluebird');

function get(f, q, attempt) {
    //logger.trace('request url: ' + f);
    let query = q ? q : {};
    //logger.trace('query: ' + JSON.stringify(query));
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
            })
    })
    .catch(err => {
        logger.error('CAUGHT ERROR ' + err);
        // attempt = attempt ? attempt : 1;
        // if (attempt < 5) {
        //     attempt += 1;
        //     logger.info(`trying request again... (attempt ${attempt})`);
        //     return get(f, q, attempt);
        // }

    });
}

function getActivityHistory(playerData, mode, dateStart, dateEnd) {
    let promises = [];

    playerData.characters.forEach(character => {
        let options = {
            count: 100,
            page: 0,
            mode: mode,
            groups: 'General,Medals,Weapons,Enemies'
        };
        logger.warn(character);
        let activities = [];
        promises.push(getCharacterActivities(activities, playerData.account.membershipType, playerData.account.membershipId, character, options, dateStart, dateEnd))
    })
    return Promise.all(promises);
}

function getCharacterActivities(activities, membershipType, membershipId, character, options, dateStart, dateEnd) {
    return get(apis.getActivityHistory(membershipType, membershipId, character.characterId), options)
    .then(results => {
        options.page += 1;
        if (results.data.activities) {

            activities = activities.concat(results.data.activities.filter(activity => {
                let period = activity.period.substring(0, 10)
                // logger.info('Comparing ' + activity.period.substring(0, 10) + ' and ' + dateStart);
                // logger.info(period > dateStart && period < dateEnd);
                //if (activity.period.substring(0, 10) < )
                if (period >= dateStart && period <= dateEnd) {
                    return activity;
                }
            }));
            return getCharacterActivities(activities, membershipType, membershipId, character, options, dateStart, dateEnd);
        } else {
            logger.info(activities.length);
            let promises = [];
            activities.forEach(activity => {
                promises.push(addPostGameCarnage(character.characterId, activity, activity.activityDetails.instanceId));
            });
            return Promise.all(promises)
            .then(reduce)
            .then(aggregate => {
                aggregate.classType = character.classType;
                aggregate.characterId = character.characterId;
                return Promise.resolve(aggregate);
            });
        }
    });
}

function reduce(activities) {
    if (activities.length === 0) {
        return {
            kills: 0,
            deaths: 0,
            score: 0,
            assists: 0,
            precisionKills: 0,
            longestKillSpree: 0,
            longestSingleLife: 0,
            combatRating: 0,
            place: 0,
            games: 0,
            standing: 0,
            medals: {}
        };
    }
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
            assists: a.assists + b.assists,
            score: a.score + b.score,
            precisionKills: a.precisionKills + b.precisionKills,
            longestKillSpree: spree,
            longestSingleLife: life,
            combatRating: a.combatRating + b.combatRating,
            place: a.place + b.place,
            games: a.games + b.games,
            standing: a.standing + b.standing,
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
    });
}

function analyzePerCharacterStats(activities) {
    //logger.info(activities);
    // titan, hunter, warlock
    let titanKd = '';
    let hunterKd = '';
    let warlockKd = '';
    let titanKad = '';
    let hunterKad = '';
    let warlockKad = '';
    activities.forEach(activity => {
        if (activity.classType === 0) {
            titanKd = (activity.kills/activity.deaths).toString().substring(0, 5);
            titanKad = ((activity.kills + activity.assists)/activity.deaths).toString().substring(0, 5);
        } else if (activity.classType === 1) {
            hunterKd = (activity.kills/activity.deaths).toString().substring(0, 5);
            hunterKad = ((activity.kills + activity.assists)/activity.deaths).toString().substring(0, 5);
        } else if (activity.classType === 2) {
            warlockKd = (activity.kills/activity.deaths).toString().substring(0, 5);
            warlockKad = ((activity.kills + activity.assists)/activity.deaths).toString().substring(0, 5);
        }
    })
    return Promise.resolve({
        hunterKd : hunterKd,
        hunterKad: hunterKad,
        warlockKd : warlockKd,
        warlockKad: warlockKad,
        titanKd : titanKd,
        titanKad: titanKad
    });
}

function getOtherStats(characterId, activity) {
    let values = activity.entries.find(entry => {
        return entry.characterId === characterId;
    }).extended.values;

    let stats = {
        totalKillDistance: '',
        kills: '',
        deaths: '',
        assists: '',
        score: '',
        precisionKills: '',
        longestKillSpree: '',
        longestSingleLife: '', //seconds
        combatRating: '',
        weaponBestType: '',
        standing: '',
        completed: ''
    }
    for (key in stats) {
        if (key === 'weaponBestType') {
            stats[key] = values[key] ? values[key].basic.displayValue : null;
        } else if (key === 'assists') {
            let assists = 0;
            // if (values.assistsAgainstPlayerHunter) {
            //     assists += values.assistsAgainstPlayerHunter.basic.value;
            // }
            // if (values.assistsAgainstPlayerWarlock) {
            //     assists += values.assistsAgainstPlayerWarlock.basic.value;
            // }
            // if (values.assistsAgainstPlayerTitan) {
            //     assists += values.assistsAgainstPlayerTitan.basic.value;
            // }
            stats[key] = activity.values.assists.basic.value;
            //logger.debug(stats[key])
        } else if (key === 'standing') {
            stats[key] = Number(!(activity.values.standing.basic.value));
        } else if (key === 'completed') {
            stats[key] = activity.values.completed.basic.value;
        } else {
            stats[key] = values[key] ? values[key].basic.value : null;
        }
    }
    stats.games = 1;
    stats.medals = {};
    for (key in values) {
        if (key.indexOf('medal') !== -1) {
            stats.medals[key] = values[key].basic.value;
        }
    }
    return Promise.resolve(stats);
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

function convertToUTC(date) {
    return date;
}

function getStats(name, mode, dateStart, dateEnd) {
    return getPlayerInfo(name)
    .then((result) => {
        dateStart = convertToUTC(dateStart);
        dateEnd = convertToUTC(dateEnd);
        return getActivityHistory(result, mode, dateStart, dateEnd);
    })
    .then(result => {
        var promises = [];
        promises.push(analyzePerCharacterStats(result));
        promises.push(reduce(result));
        return Promise.all(promises);
        //logger.warn(result);
        //logger.debug(result[0][0]);
        //logger.debug(result[0][3].values.standing);

    })
    .then(result => {
        //logger.debug(result);
        result[1].name = name;
        return Promise.resolve(result);
    });
}

function entry() {
    let names = ['Crimson_Wrath','P1mpag0n','YLOD_Express','russbluedevil44'];
    let mode = 'TrialsOfOsiris';
    mode = 'AllPvP';
    mode = 'IronBanner';
    let dateStart = '2016-12-01';
    let dateEnd = '2016-12-11';
    let promises = [];
    names.forEach(name => {
        promises.push(getStats(name, mode, dateStart, dateEnd));
    });
    return Promise.all(promises);
}
// entry();

module.exports = {
    getStats: function(names, mode, dateStart, dateEnd) {
        let promises = [];
        names.forEach(name => {
            promises.push(getStats(name, mode, dateStart, dateEnd));
        });
        return Promise.all(promises);
    }
};
