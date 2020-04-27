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


app.listen(process.env.PORT || 8080, () => {
  console.log("Server has started.");
});

export {}