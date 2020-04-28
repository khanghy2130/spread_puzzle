const express = require('express');
const path = require('path');
const socket = require("socket.io");
const socketManager = require("./socketManager.ts").manager;

const app = express();
const server = require('http').Server(app);
const io = socket(server);


app.use(express.static(path.join(__dirname, '../build')));

// serving the app for any route
app.get('*', function (req: any, res: any) : void {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

const namespace = io.of('server'); // 'server' namespace
namespace.on('connection', socketManager);


server.listen(process.env.PORT || 8080, () : void => {
  console.log("Server has started.");
});

export {}