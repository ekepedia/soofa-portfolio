var Messages = require("../models/Messages").reference;
var socketio = require('socket.io');

var io;

module.exports.init = function (server) {

    io = socketio.listen(server);

    var sockets = [];

    io.on('connection', function (socket) {

        sockets.push(socket.id);

        socket.on("message", function (data) {
            Messages.push(data);
        });
    });

};

module.exports.emit = function (name, speech_text, photo_url) {
    if(name && speech_text && photo_url)
        io.emit('message', {
            name: name,
            speech_text: speech_text,
            photo_url: photo_url
        });
};