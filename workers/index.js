const backgroundWorkers = {};

// Workers
const checkAndDeleteFiles = require('./deleteFiles');

backgroundWorkers.checkAll = () => {
  // check deleted files
  checkAndDeleteFiles();
};

backgroundWorkers.start = () => {
  backgroundWorkers.checkAll();

  setInterval(() => {
    backgroundWorkers.checkAll();
  }, 5000);
};

module.exports = backgroundWorkers;
