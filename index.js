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



const sendRecentUploads = async what =>
  what.emit('server:recent-uploads', await Message.getMostRecentPublic());

socket.on('connection', async socket => {
  console.log('user connected');
  await sendRecentUploads(socket);
  socket.on('client:request-recent-uploads', () => sendRecentUploads(socket));

  console.log('with user actions')
  socket.on('client:create-account', async (data, cb) => {
    console.log('create-account action', data)
    cb(
      await User.createAccount(data)
    )
  });

  socket.on('client:login', async (data, cb) => {
    console.log({ data }, 'login')
    cb(
      await User.login(data)
    )
  });

  socket.on('client:auth-token', async (data, cb) => {
    cb(
      await User.authToken(data)
    )
  });
  
});

app.use('/audio', express.static(path.join(__dirname, 'uploads')))

const fileUpload = require('express-fileupload');
app.use(fileUpload());
app.post('/upload', uploadFileHandler, () => {
  console.log('next sendingrecentuploads');
  sendRecentUploads(socket);
});


http.listen(port, () => {
  console.log('connected to port: '+ port)
});