const express = require('express');
const app = express();
const http = require('http').Server(app)
const io = require('socket.io');

const port = 500;

const socket = io(http);
socket.on('connection', socket => {
  console.log('user connected');
  socket.emit('server:welcome', {
    important: 'I welcome you'
  });
});

const fileUpload = require('express-fileupload');
app.use(fileUpload());
app.post('/upload', function(req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let audioFile = req.files.audioFile;
  console.log('got', audioFile)
  // Use the mv() method to place the file somewhere on your server
  audioFile.mv('/root/record-audio-backend/uploads', err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }
    res.send('File uploaded!');
  });
});

http.listen(port, () => {
  console.log('connected to port: '+ port)
});