var winston            = require("winston"),
    winston_papertrail = require("winston-papertrail");

winston_papertrail.Papertrail;

var winstonPapertrail = new winston.transports.Papertrail({
    host: 'logs6.papertrailapp.com',
    port: 31969
});

winstonPapertrail.on('error', function(err) {
    // Handle, report, or silently ignore connection errors and failures
});

winston.add(winston.transports.Papertrail, {
    host: 'logs6.papertrailapp.com',
    port: 31969,
    level: "debug",
    colorize: true,
    logFormat: function(level, message) {
        return '[backend: notifications] [' + level + '] ' + message;
    }
});