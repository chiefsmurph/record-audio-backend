const express = require('express');
const app = express();
const http = require('http').Server(app)
const io = require('socket.io');

const getRecentUploads = require('./get-recent-uploads');

const port = 500;

const socket = io(http);


socket.on('connection', async socket => {

  const sendRecentUploads = async () =>
    socket.emit('server:recent-uploads', await getRecentUploads());


  console.log('user connected');
  await sendRecentUploads();
  socket.on('client:request-recent-uploads', sendRecentUploads);

});

app.use('/audio', express.static('uploads'));

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
  });
});



http.listen(port, () => {
  console.log('connected to port: '+ port)
});