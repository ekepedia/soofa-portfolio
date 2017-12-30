var oj = require('mongoose-simpledb').Types.ObjectId;

exports.schema = {
    agentId: { type: oj, ref: 'Agent' },
    name: String,
    email: String,
    date: Number,
    text: String,
    approved: Boolean
};
