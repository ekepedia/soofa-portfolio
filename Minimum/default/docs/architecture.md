# Minimum API Architecture

The API was designed with adaptability in mind. For that reason, processes are split up into Routers, Controllers, and Services. At the highest level of abstraction, there exists a routes.js file that specifies all the routes used in the application.

## route.js

```javascript
module.exports = [
    {
        path: "/path/to/endpoint",
        router: "pathtoendpoint" // This is the concatenation of the path to lowercase
    }
]
```
### Example:
```javascript
module.exports = [
    {
        path: "/messages",
        router: "messages"
    },
    {
        path: "/slack/oauth",
        router: "slackouath"
    },
]
```

Note that only the highest level endpoints should be listed in this file. For example, if you have /messages/all, /messages/onem /messages/:id/edit, etc. then you should only list the path /messages in the routes.js file. The child routes are to be handled in the router. There should be one router handling all endpoints under /messages, for example.

## Routers

```javascript
var express = require('express'),
    router  = express.Router();

// Import Route Specific Controller
var RouteController = require('../../controllers/RouteController');

// Middleware to be called before every route in this router [Optional]
router.use(function (req, res, next) {
    // Your code here
    next();
});

// Any endpoints
router.METHOD('/path/to/endpoint', function (req, res) {
    RouteController.method(req, res);
});

module.exports = router;
```
### Example:
```javascript
var express = require('express'),
    router  = express.Router();

var MessageController = require('../../controllers/MessageController');

// since this router is under the /messages route, you need to omit /messages when referring to child endpoints
router.get('/', function (req, res) {
    MessageController.all(req, res);
});

router.post('/:id', function (req, res) {
    MessageController.one(req, res);
});

module.exports = router;
```

Every single router must have a Controller, and the Controller must have a method defined for every endpoint. This is to keep redundancy to a minimum and make use of Node.js's concurrency by redirecting traffic away from the routers. Once a route is set, the only modification should happen at the Controller and Service level.

## Controllers
```javascript
// Require Services
var AnyService      = require("../services/AnyService");
var DifferntService = require("../services/DifferntService");

module.exports.METHOD = function (req, res) {
    AnyService.anyMethod(function (err, anyResult) {
        if(err){
            // ALWAYS HANDLE ERRORS
        }
        DifferentService.differentMethod(anyResult, function (err, differentResult) {
            if(err){
                // AGAIN, THE ERRORS
            }
            res.json(differentResult); // DON'T FORGET TO RESPOND. This is done at the controller level
        });
    });
};
```
### Example:
```javascript
var MessageService  = require("../services/MessageService");

module.exports.all = function (req, res) {
    MessageService.getAll(function (err, messages) {
        if(err){
            return res.json(err);
        }
        res.json(messages);
    })
};
```

Controller should minimize of actual code that is executed and instead focus on the general logic. For example, if I want to get all of the contacts of a user and then send them each a message, I should should use the ContactsController.getAll() method to get all of the contacts and then use MessageController.newMessage(contact) to send a message to them. This is in contrast to directly pooling from the database and then directly dealing with the message sender. We do it this way because if we want to modify the database and/or third party integrations, we only have to make those changes at the Services level.

## Services

```javascript
// Require anything you need
var AnyModel = require("../models/AnyModel")

module.exports.METHOD = function (callback) {

    callback = (typeof callback === 'function') ? callback : function() {}; // You MUST validate that the callback is a function

    // Do what ever
    AnyModel.METHOD(function(err,anyResult) {
        if(err){
            // DID YOU FORGOT ALREADY?? HANDLE THE ERRORS
            return callback(err);
        }

        callback(null, anyResult); // Don't forget to set the err field to null if there are no errors

    });
};
```
### Example:
```javascript
var Message = require("../models/Message");

module.exports.getAll = function (callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Message.query("SELECT * FROM messages", function(err, messages){
        if(err){
            return callback(err);
        }
        callback(null, messages);
    });

};
```

Services can do just about anything in them; this is the level where the major of chunks of code should go. By having them here, we don't have to repeat these complex blocks of code in different places of our app.

## Managers (replacing Routers)

There are some actions that are activated via a socket and not an HTTP request. In that case, we initialize a manager rather than a router. Managers follow the same logic after the Controller level meaning they contain Services. Managers do not have Controllers because they do not interact with an Express response object. 
