const express = require('express');
const app = express();
const http = require('http').Server(app)
const io = require('socket.io');
const path = require('path');

const getRecentUploads = require('./get-recent-uploads');
const User  = require('./models/User');


const port = 500;
const socket = io(http);



const mongoose = require('mongoose');
const { mongoConnectionString } = require('./config');

mongoose.connect(mongoConnectionString, { useNewUrlParser: true });



const sendRecentUploads = async what =>
  what.emit('server:recent-uploads', await getRecentUploads());

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
      await User.login(User)
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
app.post('/upload', function(req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let audioFile = req.files.audioFile;
  console.log('got', audioFile);
  // Use the mv() method to place the file somewhere on your server
  audioFile.mv(`./uploads/${audioFile.name}`, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }
    res.send('File uploaded!');
    sendRecentUploads(socket);
  });
});


http.listen(port, () => {
  console.log('connected to port: '+ port)
});