var common = require("../common");

var GroupService = common.GroupService;

var TEST_RECIEVER = common.TEST_RECIEVER;
var TEST_GROUP    = common.TEST_GROUP;


it('Should get all groups for user', function (done) {

    this.timeout(50000);

    GroupService.populate_groups(TEST_RECIEVER, done);
});

it('Should get one group', function (done) {

    this.timeout(50000);

    GroupService.populate_group(TEST_GROUP, done);
});