const express = require('express');
const app = express();
const http = require('http').Server(app)
const io = require('socket.io');
const path = require('path');

const User  = require('./models/User');
const Message  = require('./models/Message');
const uploadFileHandler = require('./actions/upload-file-handler');

const port = 500;
const socket = io(http);



const mongoose = require('mongoose');
const { mongoConnectionString } = require('./config');

mongoose.connect(mongoConnectionString, { useNewUrlParser: true });


const socketCache = {};

const sendRecentUploads = async socket => {
  const toSend = socket ? [socket] : Object.values(socketCache);
  for (let socket of toSend) {
    socket.emit('server:recent-uploads', await Message.getFeed(socket.username));
  }
}

socket.on('connection', async socket => {

  const successfulLogin = ({ username }) => {
    socket.username = username;
    socketCache[username] = socket;
  };

  console.log('user connected');
  await sendRecentUploads(socket);
  socket.on('client:request-recent-uploads', () => sendRecentUploads(socket));

  console.log('with user actions')
  socket.on('client:create-account', async (data, cb) => {
    console.log('create-account action', data);
    const success = await User.createAccount(data);
    if (success) {
      successfulLogin(data);
    }
    cb(success);
  });

  socket.on('client:login', async (data, cb) => {
    console.log({ data }, 'login');
    const success = await User.login(data);
    if (success) {
      successfulLogin(data);
    }
    cb(success);
  });

  socket.on('client:auth-token', async (data, cb) => {
    const success = await User.authToken(data);
    if (success) {
      successfulLogin(data);
    }
    cb(success);
  });
  
});

app.use('/audio', express.static(path.join(__dirname, 'uploads')))

const fileUpload = require('express-fileupload');
app.use(fileUpload());
app.post('/upload', uploadFileHandler, () => {
  console.log('next sendingrecentuploads');
  sendRecentUploads();
});


http.listen(port, () => {
  console.log('connected to port: '+ port)
});