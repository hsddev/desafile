const fs = require('fs');
const path = require('path');

const content = (language) => {
  let file;
  try {
    file = fs.readFileSync(path.join(path.resolve(), 'lang.json'), 'utf-8');
  } catch (e) {
    throw new Error("Can't found language file");
  }
  try {
    file = JSON.parse(file);
  } catch (e) {
    throw new Error("Can't parse language file");
  }
  if (!(language in file)) {
    throw new Error("Can't found language in file");
  }
  return file[language];
};

module.exports = content;
