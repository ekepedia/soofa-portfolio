var CronJob = require('cron').CronJob;

var EmailService = require("./services/EmailService");
var TRIE         = require("./managers/managers/TRIE");

var winston = require("winston");

TRIE = new TRIE(false, true);

var job = new CronJob({
    cronTime: '00 00 02 * * 0-6',
    onTick: function() {
        EmailService.daily_email(function (err) {
            if(err)
                winston.error(err);
        })
    },
    start: true,
    timeZone: 'America/Los_Angeles'
});