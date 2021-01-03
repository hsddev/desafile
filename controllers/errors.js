const details = require('../config/details');

// Not Found Error
exports.getError404 = (req, res, next) => {
  const error = new Error('Page Not Found');
  error.status = 404;
  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  error.url = fullUrl;
  next(error);
};

// Get Error Msg
// eslint-disable-next-line no-unused-vars
exports.getErrorMsg = (error, req, res, next) => {
  const errorCode = error.status || 500;
  const errorType = errorCode === 404 ? 'errors/notFound' : 'errors/unKnown';
  // Register error msg
  if (errorCode === 404) {
    if (error.url) console.log('Error: Not Found: %s', error.url);
  } else {
    console.log(error);
  }
  // send error msg page
  return res.status(errorCode).render(errorType, { page: { ...details } });
};
