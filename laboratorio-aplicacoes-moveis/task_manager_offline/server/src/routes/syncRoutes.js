/**
 * Sync Routes
 * 
 * Rotas para sincronização de tarefas.
 */

const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');

// POST /api/sync/batch - Sincronização em lote
router.post('/batch', syncController.batch);

module.exports = router;





