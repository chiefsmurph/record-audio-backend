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

http.listen(port, () => {
  console.log('connected to port: '+ port)
});