var common = require("../common");

var UserService = common.UserService;

var TEST_RECIEVER = common.TEST_RECIEVER;
var TEST_SENDER   = common.TEST_SENDER;


it('Should get all conversations for user', function (done) {

    this.timeout(50000);

    UserService.get_contacts(TEST_SENDER, done);
});

