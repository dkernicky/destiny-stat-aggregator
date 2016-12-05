let log4js = require('log4js');
module.exports = function(classname) {
    return log4js.getLogger(classname);
}
