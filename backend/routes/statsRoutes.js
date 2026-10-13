const express = require('express');
const router = express.Router();
const { getPublicStats } = require('../controllers/statsController');

// Public — no auth required
router.get('/', getPublicStats);

module.exports = router;
