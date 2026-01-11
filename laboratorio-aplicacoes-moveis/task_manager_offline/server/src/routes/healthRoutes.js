/**
 * Health Routes
 * 
 * Rotas para verificação de saúde da API.
 */

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

router.get('/health', healthController.check);

module.exports = router;





