function getBaseUrl() {
    return 'https://bungie.net/Platform/Destiny';
}

// GET Returns Destiny account information for the supplied membership in a compact summary form. Don't you want to be a cool kid and use this service instead of GetAccount?
function getAccountSummary(membershipType, destinyMembershipId) {
    return `${getBaseUrl()}/${membershipType}/Account/${destinyMembershipId}/Summary/`;
}

// GET Gets activity history stats for indicated character.
function getActivityHistory(membershipType, destinyMembershipId, characterId) {
    return `${getBaseUrl()}/Stats/ActivityHistory/${membershipType}/${destinyMembershipId}/${characterId}/`;
}

// GET Returns information about all items on the for the supplied Destiny Membership ID, and a minimal set of character information so that it can be used.
function getItems(membershipType, destinyMembershipId) {
    return `${getBaseUrl()}/${membershipType}/Account/${destinyMembershipId}/Items/`;
}

function getActivities(membershipType, destinyMembershipId, characterId) {
    return `${getBaseUrl()}/${membershipType}/Account/${destinyMembershipId}/Character/${characterId}/Activities/`;
}

// GET Returns summary information for the inventory for the supplied character.
function getInventorySummary(membershipType, destinyMembershipId, characterId) {
    return `${getBaseUrl()}/${membershipType}/Account/${destinyMembershipId}/Character/${characterId}/Inventory/Summary/`;
}

// GET Provides the progression details for the supplied character.
function getProgression(membershipType, destinyMembershipId, characterId) {
    return `${getBaseUrl()}/${membershipType}/Account/${destinyMembershipId}/Character/${characterId}/Progression/`;
}

// GET Returns a character summary for the supplied membership.
function getCharacterSummary(membershipType, destinyMembershipId, characterId) {
    return `${getBaseUrl()}/${membershipType}/Account/${destinyMembershipId}/Character/${characterId}/`;
}

// not really useful for our purposes... returns OVERALL stats for everything
function getAggregateActivityStats(membershipType, destinyMembershipId, characterId) {
    return `${getBaseUrl()}/Stats/AggregateActivityStats/${membershipType}/${destinyMembershipId}/${characterId}/`;
}

// GET	Returns a list of Destiny memberships given a full Gamertag or PSN ID.
function getMembershipId(membershipType, displayName) {
    return `${getBaseUrl()}/SearchDestinyPlayer/${membershipType}/${displayName}/`;
}

function getStats(membershipType, destinyMembershipId, characterId) {
    return `${getBaseUrl()}/Stats/${membershipType}/${destinyMembershipId}/${characterId}/`;
}

function getCarnage(activityId) {
    return `${getBaseUrl()}/Stats/PostGameCarnageReport/${activityId}/`;
}

function getItem(id) {
    return `${getBaseUrl()}/Manifest/6/${id}/`;
}

module.exports = {
    getMembershipId,
    getItems,
    getActivityHistory,
    getAggregateActivityStats,
    getStats,
    getCarnage,
    getItem
};
