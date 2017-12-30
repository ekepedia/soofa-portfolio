var Mixed = require('mongoose-simpledb').Types.Mixed;
var bcrypt   = require('bcrypt-nodejs');

exports.schema = {
    MLS: String,
    name: String,
    url: String,
    registered: Boolean,
    email: String,
    number: String,
    password: String,
    approved: Boolean,
    about: String
};

exports.methods = {
    generateHash: function(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    },
    validPassword: function(password) {
        return bcrypt.compareSync(password, this.password);
    }
};