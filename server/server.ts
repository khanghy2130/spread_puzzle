const express = require('express');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, '../build')));

app.get('/ping', function (req: any, res: any) {
 return res.send('pong');
});

app.get('/', function (req: any, res: any) {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});


app.listen(process.env.PORT || 8080, () => {
  console.log("Server has started.");
});

export {}