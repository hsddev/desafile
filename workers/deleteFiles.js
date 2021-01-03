const fs = require('fs');
const path = require('path');
const File = require('../models/file');
const config = require('../config');

const checkDeletedFiles = () => {
  File.findAll().then((files) => {
    const deletedFiles = files.filter((file) => {
      const deletedDate = file.get('deleted');
      const diff = Math.abs(new Date().getTime() - +deletedDate) / 36e5;
      return deletedDate !== null && diff >= config.deleteTime;
    });
    deletedFiles.forEach((file) => {
      const filePath = path.normalize(file.get('path'));
      const fileId = file.get('id');
      fs.unlink(filePath, (err) => {
        if (err) return console.log('BGW: Cannot delete file: %s', fileId);
        return file.destroy().then(() => {
          console.log(`BGW: File (${fileId}) from (${filePath}) has been deleted.`);
        });
      });
    });
  });
};

module.exports = checkDeletedFiles;
