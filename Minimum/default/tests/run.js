"use strict";

require('dotenv').config();

var initializers = require("../src/initializers/initializers");

initializers.forEach(function (i) {
    require("../src/initializers/initializers/"+i.initializer);
    console.log(i.name + " initialized");
});

function importTest(name, path) {
    describe(name, function () {
        require(path);
    });
}

describe("API Tests", function () {

    importTest("Conversations", './Api/Conversations');
    importTest("Groups", './Api/Groups');
    importTest("Contacts", './Api/Contacts');

});



