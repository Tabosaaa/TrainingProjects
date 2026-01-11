/**
 * Task Controller
 * 
 * Controller para operações CRUD de tarefas.
 */

const Task = require('../models/Task');

/**
 * Lista tarefas de um usuário
 * GET /api/tasks
 */
function index(req, res) {
  try {
    const { userId = 'user1', modifiedSince } = req.query;
    const since = modifiedSince ? parseInt(modifiedSince) : null;
    
    const tasks = Task.findByUser(userId, since);
    
    console.log(`📤 Retornando ${tasks.length} tarefas para ${userId}`);
    
    res.json({
      tasks,
      lastSync: Date.now(),
      serverTime: Date.now()
    });
  } catch (error) {
    console.error('❌ Erro ao listar tarefas:', error.message);
    res.status(500).json({ error: 'Erro ao listar tarefas' });
  }
}

/**
 * Cria uma nova tarefa
 * POST /api/tasks
 */
function create(req, res) {
  try {
    const data = req.body;
    
    // Verificar se já existe (idempotência)
    if (data.id) {
      const existing = Task.findById(data.id);
      if (existing) {
        console.log(`⚠️ Tarefa ${data.id} já existe, retornando existente`);
        return res.status(200).json({ task: existing });
      }
    }
    
    const task = Task.create(data);
    res.status(201).json({ task });
  } catch (error) {
    console.error('❌ Erro ao criar tarefa:', error.message);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
}

/**
 * Atualiza uma tarefa
 * PUT /api/tasks/:id
 */
function update(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const clientVersion = data.version || 1;
    
    const result = Task.update(id, data, clientVersion);
    
    if (!result.success) {
      if (result.error === 'not_found') {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
      }
      
      if (result.error === 'conflict') {
        return res.status(409).json({
          error: 'Conflito de versão',
          serverTask: result.serverTask
        });
      }
    }
    
    res.json({ task: result.task });
  } catch (error) {
    console.error('❌ Erro ao atualizar tarefa:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
}

/**
 * Deleta uma tarefa
 * DELETE /api/tasks/:id
 */
function destroy(req, res) {
  try {
    const { id } = req.params;
    const deleted = Task.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao deletar tarefa:', error.message);
    res.status(500).json({ error: 'Erro ao deletar tarefa' });
  }
}

module.exports = {
  index,
  create,
  update,
  destroy
};





