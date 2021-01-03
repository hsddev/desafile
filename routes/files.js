// Dependencies
const express = require('express');

const router = express.Router();
const csrf = require('csurf');

const csrfProtection = csrf({});
const path = require('path');
const multer = require('multer');
const { check } = require('express-validator/check');

const filesController = require('../controllers/files');
const {
  isLogged, getCategories, getNotifications, getUsers
} = require('../controllers/helpers');

const config = require('../config');

router.get('/', isLogged, csrfProtection, getUsers, getNotifications, filesController.filesGet);

router.get('/new', isLogged, csrfProtection, getCategories, filesController.filesNewGet);

router.post(
  '/new',
  isLogged,
  multer({
    storage: multer.diskStorage({
      destination(req, file, cb) {
        cb(null, config.uploadDest);
      },
      filename(req, file, cb) {
        const { ext } = path.parse(file.originalname);
        cb(
          null,
          `${new Date().getTime()}-${Math.floor(Math.random() * (999999 - 100000) + 100000)}${ext}`
        );
      }
    }),
    fileFilter(req, file, cb) {
      if (req.body.title.length === 0) {
        if (file) req.file = true;
        req.body.title = '';
        return cb(null, false);
      }
      return cb(null, true);
    }
  }).single('file'),
  check('title')
    .not()
    .isEmpty()
    .withMessage('File title must not be empty.'),
  check('file')
    .custom((value, { req }) => typeof req.file !== 'undefined')
    .withMessage('File field must not be blank.'),
  check('description')
    .isLength({ max: 200 })
    .withMessage('The length of Description must be 200 characters or fewer.'),
  csrfProtection,
  filesController.filesNewPost
);

router.get(
  '/shared',
  isLogged,
  csrfProtection,
  getUsers,
  getNotifications,
  filesController.recivedFileGet
);
router.get(
  '/deleted',
  isLogged,
  csrfProtection,
  getUsers,
  getNotifications,
  filesController.deletedFilesGet
);

router.get(
  '/:fileId',
  isLogged,
  csrfProtection,
  getCategories,
  getUsers,
  getNotifications,
  filesController.fileGet
);

router.post(
  '/:fileId',
  isLogged,
  csrfProtection,
  check('title')
    .not()
    .isEmpty()
    .withMessage('File title must not be empty.'),
  check('description')
    .isLength({ max: 200 })
    .withMessage('The length of Description must be 200 characters or fewer.'),
  getUsers,
  filesController.filePost
);

router.delete('/:fileId', isLogged, csrfProtection, filesController.fileDelete);

// Export Files Router Module
module.exports = router;
