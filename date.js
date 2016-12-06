// returns full years + partial months
function doSomething(date1, date2) {
    // if (date1.substring(0, 4) !== date2.substring(0, 4)) {
        return Promise.all([
            getDaysBetween(date1, null),
            getMonthsBetween(date1, date2),
            getDaysBetween(null, date2)
        ]);
    // }
}

function getMonthsBetween(date1, date2) {
    // if (date2.substring(5,7) - date1.substring(5,7) === 1) {
    //     console.log(`No full months between ${date1} and ${date2}`);
    //     return Promise.resolve({});
    // } else {
    console.log(date2);
        date1 = new Date(date1);
        date2 = new Date(date2);
        return Promise.resolve({
            periodType: 'Monthly',
            monthstart: `${(new Date(date1.getFullYear(), date1.getMonth() + 1, 1).toJSON()).substring(0, 7)}`,
            monthend: `${(new Date(date2.getFullYear(), date2.getMonth() - 1, 1).toJSON()).substring(0, 7)}`
        });
    // }
}

function getDaysBetween(date1, date2) {
    // logger.info('getDaysBetween ENTER');
    if (date1 === null) {
        // get data from beginning of month to date2
        return Promise.resolve({
            periodType: 'Daily',
            daystart: `${date2.substring(0, 7)}-01`,
            dayend: `${date2.substring(0, 10)}`
        });
    } else {
        return Promise.resolve({
            periodType: 'Daily',
            daystart: `${date1.substring(0, 10)}`,
            dayend: `${date1.substring(0, 7)}-${new Date(date1.substring(0, 4), date1.substring(5, 7), 0).getDate()}`
        });
    }
}

module.exports = {
    getDaysBetween,
    getMonthsBetween,
    doSomething
};
