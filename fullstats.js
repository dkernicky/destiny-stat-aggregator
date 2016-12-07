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
                    //console.log(res.header['x-selfurl']);
                    //console.log('done');
                    //logger.info(res);
                    resolve(res.body.Response);
                }
            });
    });
}

// function getActivityHistory(count, definitions, characterId, page, destinyMembershipId, membershipType, mode) {
//
// }

function getActivityHistory(playerData, mode) {
    let promises = [];

    playerData.characters.forEach(character => {
        let options = {
            count: 100,
            page: 0,
            mode: mode
        };
        let activities = [];
        promises.push(recurse(activities, playerData.account.membershipType, playerData.account.membershipId, character.characterId, options))
    })
    return Promise.all(promises);
    // .then(activities => {
    //     logger.trace(activities);
    //     // activities.forEach(activityGroup => {
    //     //     activityGroup.forEach(activity => {
    //     //         getPostGameCarnage(activity.activityDetails.instanceId)
    //     //         .then(result => {
    //     //             //logger.error(result);
    //     //             activity.entries = result.entries;
    //     //             activity.teams = result.teams;
    //     //             logger.error(activity);
    //     //         })
    //     //     });
    //     // });
    //     // return Promise.resolve(activities);
    // });
}

function recurse(activities, membershipType, membershipId, characterId, options) {
    return get(apis.getActivityHistory(membershipType, membershipId, characterId), options)
    .then(results => {
        options.page += 1;
        if (results.data.activities) {

            activities = activities.concat(results.data.activities);
            return recurse(activities, membershipType, membershipId, characterId, options);
        } else {
            logger.info(activities.length);
            let promises = [];
            activities.forEach(activity => {
                promises.push(getPostGameCarnage(activity, activity.activityDetails.instanceId));
            });
            return Promise.all(promises);
        }
    });
}

function getCharacterActivities(activities, membershipType, membershipId, characterId, options) {
        // return recurse(activities, membershipType, membershipId, characterId, options)
        // .then(activities => {
            let promises = [];
            activities.forEach(activity => {
                if (!activity.activityDetails) {
                    logger.error(activity);
                }
                promises.push([getPostGameCarnage(activity, activity.activityDetails.instanceId)]);
            })
            //getPostGameCarnage()
            return Promise.all(promises);
        // })
        // .catch(err => {
        //     logger.error(err);
        //     //getPostGameCarnage();
        // })
}

function getPostGameCarnage(activity, activityId) {
    return get(apis.getCarnage(activityId))
    .then(result => {
         logger.info('OHHHH HERRRRO CROOOTA');
         logger.debug(result);
        // activity.entries = result.entries;
        // activity.teams = result.teams;
        return Promise.resolve({
            period: activity.period,
            activityDetails: activity.activityDetails,
            values: activity.values,
            entries: result.data.entries,
            teams: result.data.teams
        });
    });
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
                //logger.trace('character info: ' + JSON.stringify(result.data.characters));
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
        logger.warn(result);
        logger.debug(result[0][0]);
        //logger.debug(result[0][3].values.standing);

    });
}
entry();
