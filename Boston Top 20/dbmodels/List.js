var Mixed = require('mongoose-simpledb').Types.Mixed;

exports.schema = {
    sort_by: String,
    area: String,
    county: String,
    time: String,
    calculated: Number,
    list: Mixed,
    date: Date
};
