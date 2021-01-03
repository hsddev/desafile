// Dep's
const express = require('express');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const SessionStore = require('express-mysql-session');
const path = require('path');
const fs = require('fs');
const routes = require('./routes/');
const sequelize = require('./config/database');
const config = require('./config');
const backgroundWorkers = require('./workers');
// Body Parser
app.use(bodyParser.urlencoded({ extended: true }));

// App Setting
app.engine('ejs', require('ejs-locals'));

app.set('views', path.join(path.resolve(), '/views'));
app.set('view engine', 'ejs');
app.disable('x-powered-by');

const store = new SessionStore(config.db);
// Session
app.use(
  session({
    cookie: { maxAge: config.cookieAge * 1000 * 60 * 60 },
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store
  })
);
// Flash
app.use(flash());

// Static Folders
app.use('/assets', express.static('assets'));

// Socket IO
io.on('connection', (socket) => {
  const { handshake } = socket;
  if (handshake.headers.cookie) {
    let sessionID = /connect.sid=([^;]+)/g.exec(handshake.headers.cookie);
    if (sessionID && sessionID.length) {
      sessionID = unescape(sessionID[1])
        .split('.')[0]
        .slice(2);
    }
    store.get(sessionID, (error, storeSession) => {
      if (storeSession && storeSession.userId) socket.join(storeSession.userId);
    });
  }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/', routes);

sequelize
  .sync({ logging: false })
  .then(() => {
    // Check database
    console.log('Database Synced!');
  })
  .then(() => {
    // eslint-disable-next-line no-bitwise
    fs.accessSync(config.uploadDest, fs.constants.R_OK | fs.constants.W_OK);
    console.log('Uploads path exists and ready!');
  })
  .then(() => {
    backgroundWorkers.start();
    console.log('Background Workers Started!');
  })
  .then(() => {
    server.listen(config.httpPort);
    console.log('Server Started!');
  })
  .catch((error) => {
    console.log(error);
  });
