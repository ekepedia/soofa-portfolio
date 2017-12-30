var common = require("../common");

var ConversationService = common.ConversationService;

var TEST_RECIEVER = common.TEST_RECIEVER;
var TEST_SENDER   = common.TEST_SENDER;


it('Should get all conversations for user', function (done) {

    this.timeout(50000);

    ConversationService.populate_all(TEST_RECIEVER, done);
});

it('Should get all deep conversations for user', function (done) {

    this.timeout(50000);

    ConversationService.populate_all_deep(TEST_RECIEVER, done);
});

it('Should get one conversation for user', function (done) {

    this.timeout(50000);

    ConversationService.populate(TEST_RECIEVER, TEST_SENDER, done);
});

it('Should get one deep conversation for user', function (done) {

    this.timeout(5000);

    ConversationService.populate_deep(TEST_RECIEVER, TEST_SENDER,done);
});
