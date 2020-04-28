const express = require('express');
const path = require('path');
const socket = require("socket.io");

const app = express();
const server = require('http').Server(app);
const io = socket(server);


app.use(express.static(path.join(__dirname, '../build')));

// serving the app for any route
app.get('*', function (req: any, res: any) {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

const namespace = io.of('server'); // 'server' namespace
namespace.on('connection', (socket: any) => {

  console.log('a user connected');
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

    ///////////////////////////// dummy event
  socket.on("justtalk", (msg: string, num: number) => {
    console.log(msg, num)
  });

});


server.listen(process.env.PORT || 8080, () => {
  console.log("Server has started.");
});

export {}