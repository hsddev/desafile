// Dependencies
const express = require('express');

const router = express.Router();

// Routes
const authRoute = require('./auth');
const pagesRoute = require('./pages');
const filesRoute = require('./files');
const accountRoute = require('./account');

// Controllers
const errors = require('../controllers/errors');

// Routes Path
router.use('/', authRoute); // Auth
router.use('/', pagesRoute); // Pages
router.use('/files', filesRoute); // Pages
router.use('/', accountRoute); // Users => Profile & users pages

// Erorrs Handler & Pages
router.use(errors.getError404); // 404 Error
router.use(errors.getErrorMsg); // 500 Error

// Export Router Module
module.exports = router;
