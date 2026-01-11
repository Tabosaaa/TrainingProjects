const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

router.get('/health', healthController.check);
router.get('/localstack', healthController.localstackStatus);

module.exports = router;
