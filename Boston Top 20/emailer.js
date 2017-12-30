var config   = require('./config');
var admin = require('nodemailer').createTransport(config.adminSmtp);

admin.verify(function(err) {
    if (err) {
        console.log(err);
    } else {
        console.log('admin@ server is ready to take our messages');
    }
});


module.exports = {
    admin: admin
};