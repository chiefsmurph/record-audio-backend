const Message = require('../models/Message');
const User = require('../models/User');
const getRecentUploads = require('../actions/get-recent-uploads');

(async () => {
  const recentUploads = await getRecentUploads();
  console.log({ recentUploads});

  for (let upload of recentUploads) {
    console.log({ upload })
    const [fileName, fileType] = upload.split('.');
    const [username, name] = fileName.split(' - ');

    console.log({ username, name, fileName, fileType})
    if (!username || !name) {
      console.log('unable to handle', upload);
      continue;
    }
    console.log({ username, name, fileName, fileType})
    await Message.create({
      user: await User.findOne({ username }),
      name,
      fileName: upload,
    });
  }
})();


setTimeout(() => {}, 10000)