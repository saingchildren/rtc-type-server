"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var express = require("express");
var http = require("http");
var socketio = require("socket.io");
var cors = require("cors");
var app = express();
var server = http.createServer(app);
var io = new socketio.Server(server, {
    cors: {
        origin: "*"
    }
});
var sortName = function (username1, username2) {
    return [username1, username2].sort().join("-");
};
app.use(cors());
var allMsg = {};
var users = [];
io.on("connection", function (socket) {
    var id = socket.id;
    console.log(id);
    socket.on("create", function (username, callback) {
        var existingUser = users.find(function (user) { return user.username === username; });
        if (existingUser)
            return callback("This username is been taken!");
        var user = { id: id, username: username };
        users.push(user);
        socket.on("getUsers", function () {
            io.emit("users", users);
        });
    });
    socket.on("disconnect", function () {
        var index = users.findIndex(function (user) { return user.id === id; });
        if (index !== -1) {
            users.splice(index, 1)[0];
        }
        io.emit("users", users);
    });
    socket.on("send_msg", function (_a) {
        var receiver = _a.receiver, message = _a.message;
        var senderData = users.find(function (user) { return user.id === socket.id; });
        var receiverData = users.find(function (user) { return user.username === receiver; });
        var key = sortName(senderData.username, receiverData.username);
        console.log("".concat(senderData.username, " send ").concat(message, " to ").concat(receiverData.username));
        var msg = {
            receiver: receiverData.username,
            sender: senderData.username,
            msg: message,
            view: false
        };
        if (key in allMsg) {
            allMsg[key] = __spreadArray(__spreadArray([], allMsg[key], true), [msg], false);
        }
        else {
            allMsg[key] = [msg];
        }
        console.log(msg[key]);
        io.to(receiverData.id).to(senderData.id).emit("get_msg", allMsg[key]);
    });
});
server.listen(process.env.PORT || 1100, function () {
    console.log("1100");
});
