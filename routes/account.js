// Dependencies
const express = require('express');

const router = express.Router();
const csrf = require('csurf');

const csrfProtection = csrf({});
const multer = require('multer');
const path = require('path');
const { check, validationResult } = require('express-validator/check');
const fs = require('fs');
const bcrypt = require('bcrypt');
const helper = require('../helpers');
const details = require('../config/details');
const { formatBytes } = require('../helpers');
const { isLogged, getNotifications, getUsers } = require('../controllers/helpers');
const config = require('../config');
const User = require('../models/user');
const File = require('../models/file');

router.get('/', (req, res) => res.redirect('/files'));

router.get('/users/:username', isLogged, (req, res) => res.send('Comming Soon'));

router.get('/avatar', isLogged, getUsers, (req, res) => {
  const { username } = req.query;
  const user = req.users.find(userObj => userObj.username === username);
  if (user && user.avatar) {
    return res.sendFile(path.join(config.avatarsDest, user.avatar));
  }
  return res.sendFile(path.join(config.avatarsDest, 'default.jpg'));
});

router.get('/profile', isLogged, csrfProtection, getNotifications, (req, res) => {
  const { tab } = req.query;
  const user = {
    username: req.user.get('username'),
    email: req.user.get('email'),
    fullname: req.user.get('fullname'),
    phonenumber: req.user.get('phonenumber')
  };
  File.findAll({ where: { userId: req.user.get('id'), deleted: null } }).then((files) => {
    const countFiles = files.length;
    const sizes = files.map(file => file.get('size'));
    const size = countFiles === 0
      ? 0
      : sizes.reduce((accumulator, currentValue) => accumulator + currentValue);
    return res.render('pages/account', {
      navs: helper.navsItems('profile'),
      page: { ...details },
      errors: req.flash('errors'),
      panel: req.flash('panel'),
      user,
      files: {
        count: countFiles,
        size: formatBytes(size)
      },
      fullname: req.flash('fullname'),
      phonenumber: req.flash('phonenumber'),
      username: req.flash('username'),
      email: req.flash('email'),
      tab: tab || 'profile',
      notifications: req.notifications,
      csrfToken: req.csrfToken()
    });
  });
});

router.post(
  '/profile',
  isLogged,
  multer({
    storage: multer.diskStorage({
      destination(req, file, cb) {
        cb(null, config.avatarsDest);
      },
      filename(req, file, cb) {
        const { ext } = path.parse(file.originalname);
        cb(
          null,
          `${new Date().getTime()}-${Math.floor(Math.random() * (999999 - 100000) + 100000)}${ext}`
        );
      }
    }),
    fileFilter(req, file, callback) {
      const { ext } = path.parse(file.originalname);
      if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
        req.body.avatar = 'not image';
        return callback(null, false);
      }
      return callback(null, true);
    }
  }).single('avatar'),
  csrfProtection,
  check('fullname')
    .isLength({ min: 3 })
    .withMessage('Invalid Full Name'),
  check('phonenumber')
    .matches(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/, 'g')
    .withMessage('Invalid Phone Number'),
  check('avatar')
    .not()
    .matches('not image')
    .withMessage('Avatar is not image.'),
  (req, res) => {
    const { fullname, phonenumber } = req.body;
    const { file } = req;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('fullname', fullname);
      req.flash('phonenumber', phonenumber);
      req.flash('errors', errors.array());
      return res.redirect('/profile?tab=profile');
    }
    return User.findOne({ where: { id: req.user.get('id') } }).then((value) => {
      value.set('fullname', fullname);
      value.set('phonenumber', phonenumber);
      const previousAvatar = value.get('avatar');
      if (file) value.set('avatar', file.filename);
      value.save().then(() => {
        if (file && previousAvatar) {
          // delete last photo
          fs.unlinkSync(path.join(path.resolve(), '..', 'avatars', previousAvatar));
        }
        req.flash('panel', {
          type: 'success',
          msg: 'Personal information has been successfuly saved.'
        });
        return res.redirect('/profile?tab=profile');
      });
    });
  }
);

router.post(
  '/account',
  isLogged,
  csrfProtection,
  check('username')
    .matches(/^(?=.{5,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/)
    .withMessage(
      'Username should be between 5-20 characters, only contains alphanumeric characters, underscore and dot.'
    ),
  check('email')
    .isEmail()
    .withMessage('Email is invalid.')
    .trim(),
  check('password')
    .isLength({ min: 8 })
    .withMessage('Password must contain at least 8 characters.'),
  (req, res) => {
    const { username, email, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('username', username);
      req.flash('email', email);
      req.flash('errors', errors.array());
      return res.redirect('/profile?tab=account');
    }
    return User.findOne({ where: { id: req.user.get('id') } }).then((value) => {
      // check password
      const hash = value.get('password');
      bcrypt.compare(password, hash, (err, isTrue) => {
        if (!isTrue) {
          // Get password msg
          const newErrors = [{ param: 'password', msg: 'Invalid Password.' }];
          req.flash('username', username);
          req.flash('email', email);
          req.flash('errors', newErrors);
          return res.redirect('/profile?tab=account');
        }
        return User.findOne({
          where: {
            id: { $notLike: req.user.get('id') },
            $or: [{ email }, { username }]
          }
        }).then((existUser) => {
          if (existUser) {
            const mysqlErrors = [];
            if (existUser.get('username') === username) {
              mysqlErrors.push({
                param: 'username',
                msg: 'This username already exists.'
              });
            }
            if (existUser.get('email') === email) {
              mysqlErrors.push({
                param: 'email',
                msg: 'This email already exists.'
              });
            }
            req.flash('username', username);
            req.flash('email', email);
            req.flash('errors', mysqlErrors);
            return res.redirect('/profile?tab=account');
          }
          value.set('username', username);
          value.set('email', email);
          return value.save().then(() => {
            req.flash('panel', {
              type: 'success',
              msg: 'Account information has been successfuly saved.'
            });
            return res.redirect('/profile?tab=account');
          });
        });
      });
    });
  }
);

router.post(
  '/password',
  isLogged,
  csrfProtection,
  check('current')
    .isLength({ min: 8 })
    .withMessage('Password must contain at least 8 characters.'),
  check('new')
    .isLength({ min: 8 })
    .withMessage('New password must contain at least 8 characters.')
    .custom((value, { req }) => {
      if (value !== req.body.verify) {
        return false;
      }
      return value;
    })
    .withMessage('Password and Verify password must contain equal values.'),
  (req, res) => {
    const errors = validationResult(req);
    const { current, new: newPass } = req.body;
    if (!errors.isEmpty()) {
      req.flash('errors', errors.array());
      return res.redirect('/profile?tab=password');
    }
    return User.findOne({ where: { id: req.user.get('id') } }).then((user) => {
      const hash = user.get('password');
      bcrypt.compare(current, hash, (err, isTrue) => {
        if (!isTrue) {
          req.flash('errors', {
            param: 'current',
            msg: 'Invalid Current Password'
          });
          return res.redirect('/profile?tab=password');
        }
        return bcrypt.hash(newPass, 10, (bcryptErr, newHash) => {
          if (bcryptErr) {
            req.flash('errors', {
              type: 'danger',
              msg: 'Something went wrong. Please try again later!'
            });
            return res.redirect('/profile?tab=password');
          }
          user.set('password', newHash);
          return user.save().then(() => {
            req.flash('panel', {
              type: 'success',
              msg: 'Your password has been successfuly changed!'
            });
            return res.redirect('/profile?tab=password');
          });
        });
      });
    });
  }
);
// Export Pages Router Module
module.exports = router;
