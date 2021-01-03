// Dependencies
const express = require('express');

const router = express.Router();
const csrf = require('csurf');

const csrfProtection = csrf({});
const { check } = require('express-validator/check');
const authController = require('../controllers/auth');
const User = require('../models/user');

const isLogged = (req, res, next) => {
  const id = req.session && req.session.userId;
  User.findOne({
    where: { id }
  }).then((user) => {
    if (!user) {
      return next();
    }
    return res.redirect('/');
  });
};

const logOut = (req, res, next) => {
  req.session.destroy();
  return next();
};

router.get('/login', isLogged, csrfProtection, authController.loginGet);

router.post(
  '/login',
  isLogged,
  check('username') // check Username
    .not()
    .isEmpty()
    .withMessage('Username cannot be empty!'),
  check('password') // check Password
    .not()
    .isEmpty()
    .withMessage('Password cannot be empty!'),
  csrfProtection,
  authController.loginPost
);

router.get('/register', isLogged, csrfProtection, authController.registerGet);

router.post(
  '/register',
  isLogged,
  csrfProtection,
  (req, res, next) => (req.session.username ? res.status(304).redirect('/') : next()),
  check('fullname')
    .isLength({ min: 3 })
    .withMessage('Invalid Full Name'),
  check('phonenumber')
    .matches(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/, 'g')
    .withMessage('Invalid Phone Number'),
  check('username')
    .matches(/^(?=.{5,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/, 'g')
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
  authController.registerPost
);

router.get('/forgot', logOut, csrfProtection, authController.forgotGet);

router.post('/forgot', logOut, csrfProtection, authController.forgotPost);

router.get('/reset/:token', csrfProtection, authController.resetGet);

router.post(
  '/reset/:token',
  csrfProtection,
  check('password')
    .isLength({ min: 8 })
    .withMessage('New password must contain at least 8 characters.')
    .custom((value, { req }) => {
      if (value !== req.body.confirmPassword) {
        return false;
      }
      return value;
    })
    .withMessage('Password and Confirm password must contain equal values.'),
  authController.resetPost
);

router.get('/logout', logOut, (req, res) => res.redirect('/login'));

// Export Auth Router Module
module.exports = router;
