/**
 * Task Routes
 * 
 * Rotas para operações CRUD de tarefas.
 */

const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// GET /api/tasks - Listar tarefas
router.get('/', taskController.index);

// POST /api/tasks - Criar tarefa
router.post('/', taskController.create);

// PUT /api/tasks/:id - Atualizar tarefa
router.put('/:id', taskController.update);

// DELETE /api/tasks/:id - Deletar tarefa
router.delete('/:id', taskController.destroy);

module.exports = router;





