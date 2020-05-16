const fs = require('fs');
const express = require('express');
const app = express();

var options = {
  key: fs.readFileSync('./file.pem'),
  cert: fs.readFileSync('./file.crt')
};

const https = require('https').Server(app, options)
const io = require('socket.io');
const path = require('path');

const User  = require('./models/User');
const Message  = require('./models/Message');
const uploadFileHandler = require('./actions/upload-file-handler');

const port = 3008;
const socket = io(https);



const mongoose = require('mongoose');
const { mongoConnectionString } = require('./config');

mongoose.connect(mongoConnectionString, { useNewUrlParser: true });


const socketCache = {};

const watchingUsers = {};
let userCount = 0;

const increaseUserCount = () => {
  userCount++;
  socket.emit('server:user-count-change', { userCount });
};

const decreaseUserCount = () => {
  userCount--;
  socket.emit('server:user-count-change', { userCount });
};

const sendFeed = async socket => {
  const toSend = socket ? [socket] : Object.values(socketCache);
  for (let socket of toSend) {
    const { username } = socket;
    console.log('sending feed', {
      username
    });
    socket.emit('server:feed', await Message.getFeed(username));
  }
};

socket.on('connection', async socket => {

  console.log('user connected');
  increaseUserCount();
  const successfulLogin = async ({ username }) => {
    console.log('successful login for ', username)
    socket.username = username;
    socketCache[username] = socket;
    await sendFeed(socket);
  };

  // AUTH
  socket.on('client:create-account', async (data, cb) => {
    console.log('create-account action', data);
    const response = await User.createAccount(data);
    console.log({ response });
    if (response.success) {
      successfulLogin(response);
    }
    cb(response);
  });

  socket.on('client:login', async (data, cb) => {
    console.log({ data }, 'login');
    const response = await User.login(data);
    if (response.success) {
      successfulLogin(response);
    }
    cb(response);
  });

  socket.on('client:auth-token', async (data, cb) => {
    const response = await User.authToken(data);
    if (response.success) {
      successfulLogin(response);
    }
    cb(response);
  });

  socket.on('client:login', async (data, cb) => {
    console.log({ data }, 'login');
    const response = await User.login(data);
    if (response.success) {
      successfulLogin(response);
    }
    cb(response);
  });

  // GET DATA
  // socket.on('client:request-feed', () => {
  //   console.log('client requested feed', socket.username)
  //   sendFeed(socket);
  // });

  socket.on('client:request-profile', async (username, cb) => {
    console.log(`${socket.username} requests profile for ${username}`);
    cb(await User.getProfile(username));
  });

  // WATCH USERS

  socket.on('client:watch-user', username => {
    watchingUsers[username] = [
      ...watchingUsers[username] || [],
      socket
    ];
  });

  socket.on('client:stop-watching', username => {
    watchingUsers[username] = watchingUsers[username].filter(s => s !== socket);
  });

  socket.on('disconnect', () => {
    decreaseUserCount();
  });
  
});

app.use('/audio', express.static(path.join(__dirname, 'uploads')))

const fileUpload = require('express-fileupload');
app.use(fileUpload());
app.post('/upload', uploadFileHandler, req => {
  console.log('next sendingrecentuploads');
  const { recipientUser, username, message } = req.body;
  const sendTo = recipientUser ? socketCache[recipientUser] : undefined;
  console.log(JSON.stringify(req.body))
  sendFeed(sendTo);
  if (!message.isPrivate) {
    (watchingUsers[username] || []).forEach(socket => {
      socket && socket.emit('server:new-watch-message', { message });
    });
  }
});


https.listen(port, () => {
  console.log('connected to port: '+ port)
});