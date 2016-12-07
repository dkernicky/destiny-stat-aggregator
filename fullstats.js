let logger = require('./logger')('fullstats');
let apis = require('./platform_apis');
let superagent = require('superagent');

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
        promises.push(getCharacterActivities(playerData.account.membershipType, playerData.account.membershipId, character.characterId, options))
    })
    return Promise.all(promises);
}

function getCharacterActivities(membershipType, membershipId, characterId, options) {
        return get(apis.getActivityHistory(membershipType, membershipId, characterId), options)
        .then(activities => {
             //logger.info(activities);
            if (activities === undefined) {
                logger.debug('IT IS UNDEFINED')
            }
            options.page += 1;
            if (activities !== undefined && activities.data.activities) {
                //logger.info(activities.data);
                //logger.debug(activities.data === {});
                return getCharacterActivities(membershipType, membershipId, characterId, options);
            } else {
                logger.info('done');
                logger.info(options);
            }
        }).catch(err => {
            logger.error(err);
            getPostGameCarnage();
        })
}

function getPostGameCarnage() {

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
    getPlayerInfo(name)
    .then((result) => {
        return getActivityHistory(result, mode);
    })
    .then(result => {
        logger.debug(result[0].data.activities);
    });
}
entry();