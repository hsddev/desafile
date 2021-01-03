const routesArray = require('../routes/routesArray');

const helpers = {};
// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = (length, possibleChars) => {
  const strLength = typeof length === 'number' && length > 0 ? length : 15;
  const possibleChats = typeof possibleChars === 'string' && possibleChars.length > 0
    ? possibleChars
    : 'abcdefghijklmnopqrstuvwxyz0123456789';
  // Define all the possible characters that could go into a string
  const possibleCharacters = possibleChats;

  // Start the final string
  let str = '';
  for (let i = 1; i <= strLength; i += 1) {
    // Get a random charactert from the possibleCharacters string
    const randomCharacter = possibleCharacters.charAt(
      Math.floor(Math.random() * possibleCharacters.length)
    );
    // Append this character to the string
    str += randomCharacter;
  }
  // Return the final string
  return str;
};

helpers.formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const pow = k ** i;
  return `${parseFloat((bytes / pow).toFixed(dm))} ${sizes[i]}`;
};

helpers.navsItems = (currentPage) => {
  const routes = routesArray.map((route) => {
    const routeObj = { ...route };
    routeObj.active = false;
    if ('items' in routeObj) {
      routeObj.items.map((item) => {
        const itemObj = item;
        itemObj.active = false;
        if (currentPage === itemObj.id) {
          itemObj.active = true;
          routeObj.active = true;
        }
        return item;
      });
    } else if (currentPage === routeObj.id) routeObj.active = true;
    return routeObj;
  });
  return routes;
};

module.exports = helpers;
