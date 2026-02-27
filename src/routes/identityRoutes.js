const express = require('express');
const router = express.Router();
const { identify } = require('../controllers/identityController');

router.post('/identify', identify);

module.exports = router;
