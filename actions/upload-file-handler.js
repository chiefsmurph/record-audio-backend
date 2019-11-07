const User = require('../models/User');
const Message = require('../models/Message');
const slugify = require('../utils/slugify');

module.exports = async (req, res, next) => {

  // console.log({ req });

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }


  const { username, authToken, name, fileType } = req.body;
  const authorized = await User.authToken({
    username,
    authToken
  });
  if (!authorized) {
    return res.status(400).send('You are not authorized to do that.');
  } else {
    console.log("success auth", username)
  }


  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let audioFile = req.files.audioFile;
  console.log('got', audioFile);
  // Use the mv() method to place the file somewhere on your server

  // const message = await Message.create({

  // });

  let fileName = slugify(`${username}-${name}`);
  fileName = `${fileName}.${fileType}`;

  console.log({ name, username, fileName})
  const message = await Message.create({
    user: await User.findOne({ username }),
    name,
    fileName,
  });

  console.log({ message })

  audioFile.mv(`./uploads/${fileName}`, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }
    res.send('File uploaded!');
    next();
  });
};