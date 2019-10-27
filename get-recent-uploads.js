const fs = require('mz/fs');

module.exports = async () => {
  const dir = './uploads';
  let files = await fs.readdir(dir);
  files = files
    .map(function (fileName) {
      return {
        name: fileName,
        time: fs.statSync(dir + '/' + fileName).mtime.getTime()
      };
    })
    .sort((a, b) => b.time - a.time)
    .map(v => v.name);

  return files;
};