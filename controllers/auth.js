// Dependencies
const { validationResult } = require('express-validator/check');
const bcrypt = require('bcrypt');
const sgMail = require('@sendgrid/mail');
const { createRandomString: hashCreator } = require('../helpers');

// Models
const User = require('../models/user');
const Token = require('../models/token');

// Config
const config = require('../config');
const details = require('../config/details');

sgMail.setApiKey(config.sgToken); // SG token

// ## Controllers
// Login
exports.loginGet = (req, res) => res.status(200).render('authentication/login', {
  page: {
    ...details
  },
  error: req.flash('error'),
  username: req.flash('username'),
  csrfToken: req.csrfToken(),
  panel: req.flash('panel')
});

exports.loginPost = (req, res) => {
  const { username, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().forEach((e) => {
      req.flash('error', e.msg);
    });
    req.flash('username', username);
    return res.redirect('/login');
  }
  return User.findOne({ where: { username } }).then((user) => {
    if (user) {
      const hash = user.dataValues.password;
      const userId = user.dataValues.id;
      return bcrypt.compare(password, hash, (err, isTrue) => {
        if (isTrue) {
          req.session.userId = userId;
          return res.redirect('/');
        }
        req.flash('error', 'Username or Password is incorrect!');
        req.flash('username', username);
        return res.redirect('/login');
      });
    }
    req.flash('error', 'Username or Password is incorrect!');
    req.flash('username', username);
    return res.redirect('/login');
  });
};

// Register
exports.registerGet = (req, res) => res.status(200).render('authentication/register', {
  page: {
    ...details
  },
  error: req.flash('error'),
  errors: req.flash('errors'),
  login: req.flash('login'),
  csrfToken: req.csrfToken()
});

exports.registerPost = (req, res) => {
  const {
    username, email, password, fullname, phonenumber
  } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('errors', errors.array());
    req.flash('login', {
      email,
      username,
      fullname,
      phonenumber
    });
    return res.redirect('/register');
  }
  return bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      req.flash('error', 'Something went wrong. Please try again later!');
      req.flash('login', {
        email,
        username,
        fullname,
        phonenumber
      });
      return res.redirect('/register');
    }
    return User.findOrCreate({
      where: { $or: [{ email }, { username }] },
      defaults: {
        username,
        email,
        password: hash,
        fullname,
        phonenumber
      }
    }).then(([user, created]) => {
      if (!created) {
        const mysqlErrors = [];
        if (user.dataValues.username === username) {
          mysqlErrors.push({
            param: 'username',
            msg: 'This username already exists.'
          });
        }
        if (user.dataValues.email === email) {
          mysqlErrors.push({
            param: 'email',
            msg: 'This email already exists.'
          });
        }
        req.flash('errors', mysqlErrors);
        req.flash('login', {
          email,
          username,
          fullname,
          phonenumber
        });
        return res.redirect('/register');
      }
      // go to login page // Flash Error that you this username is alredy registerd
      req.session.userId = user.dataValues.id;
      return res.redirect('/');
    });
  });
};

// Password Forgot
exports.forgotGet = (req, res) => res.status(200).render('authentication/forgot', {
  page: {
    ...details
  },
  error: req.flash('error'),
  panel: req.flash('panel'),
  csrfToken: req.csrfToken()
});

exports.forgotPost = (req, res) => {
  let { 'forgot-filed': filed } = req.body;
  filed = typeof filed === 'string' && filed.trim().length > 0 ? filed : false;
  if (!filed) {
    req.flash('error', 'Invalid Username or Email address.');
    return res.redirect('/forgot');
  }
  return User.findOne({
    where: { $or: [{ email: filed }, { username: filed }] }
  }).then((user) => {
    req.flash('panel', {
      type: 'success',
      msg:
        "Thanks! If there's an account associated with this username or email, we'll send the password reset instructions immediately."
    });
    res.redirect('/login');
    if (user) {
      Token.findOrCreate({
        where: { userId: user.dataValues.id },
        defaults: {
          token: hashCreator(51)
        }
      })
        .then(([token, created]) => {
          if (!created) {
            token.set('token', hashCreator(51));
            return token.save().then(value => ({
              email: user.dataValues.email,
              token: value.dataValues.token
            }));
          }
          return {
            email: user.dataValues.email,
            token: token.dataValues.token
          };
        })
        .then(({ token, email }) => {
          // TODO: send email address
          const msg = {
            to: email,
            from: 'test@jsur.ru',
            subject: 'Password Reset',
            text: 'You can use the following link to reset your password: TOKEN LINK',
            html: `<p>Welcome,</p>
                   <p>You can use the following link to reset your password: <a href="${token}">${token}</a></p>
                   <p>If you don’t use this link within 12 hours, it will expire. To get a new password reset link, visit FORGOT_LINK</p>
                   <p>Thanks,</p>`
          };
          sgMail.send(msg, false, (err) => {
            if (err) console.log("Can't send Reset Password message to: %s", email);
          });
        });
    }
  });
};

// Reset Password
exports.resetGet = async (req, res) => {
  const { token } = req.params;
  if (!token) return res.redirect('/forgot');
  return Token.findOne({ where: { token } })
    .then((value) => {
      if (value) {
        const date1 = new Date(value.dataValues.updatedAt);
        const date2 = new Date();
        const hours = Math.abs(date1 - date2) / 36e5;
        if (hours <= config.resetPasswordTokenAge) {
          return User.findOne({ where: { id: value.dataValues.userId } });
        }
        return false;
      }
      return false;
    })
    .then((user) => {
      if (!user) return false;
      return user.dataValues.username;
    })
    .then((username) => {
      const errors = req.flash('errors');
      if (username) {
        return res.status(200).render('authentication/reset', {
          page: {
            ...details
          },
          errors,
          username,
          csrfToken: req.csrfToken()
        });
      }
      req.flash('panel', {
        type: 'danger',
        msg: 'Your reset password link has expired or is invalid.'
      });
      return res.redirect('/forgot');
    });
};

exports.resetPost = (req, res) => {
  const { token } = req.params;
  if (!token) return res.redirect('/forgot');
  const { password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('errors', errors.array());
    return res.redirect(`/reset/${token}`);
  }
  return Token.findOne({ where: { token } }).then((value) => {
    if (value) {
      const date1 = new Date(value.dataValues.updatedAt);
      const date2 = new Date();
      const hours = Math.abs(date1 - date2) / 36e5;
      if (hours <= config.resetPasswordTokenAge) {
        return User.findOne({ where: { id: value.dataValues.userId } }).then((user, err) => {
          if (err) {
            req.flash('errors', {
              msg: 'Something went wrong. Please try again leter!'
            });
          }
          return bcrypt.hash(password, 10, (bcryptErr, hash) => {
            if (bcryptErr) {
              req.flash('errors', {
                msg: 'Something went wrong. Please try again leter!'
              });
            }
            user.set('password', hash);
            user.save().then(() => Token.destroy({ where: { token } }).then(() => {
              req.flash('panel', {
                type: 'success',
                msg: 'Password has been successfully changed.'
              });
              return res.redirect('/login');
            }));
          });
        });
      }
    }
    req.flash('panel', {
      type: 'danger',
      msg: 'Your reset password link has expired or is invalid.'
    });
    return res.redirect('/forgot');
  });
};
