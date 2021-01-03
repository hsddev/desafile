const express = require('express');

const router = express.Router();

router.get('/', (req, res) => res.redirect('/files'));

// Export Pages Router Module
module.exports = router;
