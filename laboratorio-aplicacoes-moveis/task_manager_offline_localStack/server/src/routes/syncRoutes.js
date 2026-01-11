const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');

router.post('/batch', syncController.batch);

module.exports = router;
