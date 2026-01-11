/**
 * Sync Controller
 * 
 * Controller para sincronização em lote de tarefas.
 */

const Task = require('../models/Task');

/**
 * Sincronização em lote
 * POST /api/sync/batch
 */
function batch(req, res) {
  try {
    const { operations } = req.body;
    const results = [];
    
    if (!Array.isArray(operations)) {
      return res.status(400).json({ error: 'Operations deve ser um array' });
    }
    
    console.log(`🔄 Processando ${operations.length} operações em lote`);
    
    for (const op of operations) {
      try {
        let result;
        
        switch (op.type) {
          case 'OperationType.create':
          case 'create':
            result = handleCreate(op);
            break;
            
          case 'OperationType.update':
          case 'update':
            result = handleUpdate(op);
            break;
            
          case 'OperationType.delete':
          case 'delete':
            result = handleDelete(op);
            break;
            
          default:
            result = { success: false, error: 'Operação desconhecida' };
        }
        
        results.push(result);
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Batch sync: ${successCount}/${results.length} operações bem-sucedidas`);
    
    res.json({ results });
  } catch (error) {
    console.error('❌ Erro no batch sync:', error.message);
    res.status(500).json({ error: 'Erro na sincronização em lote' });
  }
}

/**
 * Processa operação de criação
 */
function handleCreate(op) {
  const data = op.data || {};
  data.id = op.taskId || data.id;
  
  // Verificar se já existe
  const existing = Task.findById(data.id);
  if (existing) {
    return { success: true, task: existing };
  }
  
  const task = Task.create(data);
  return { success: true, task };
}

/**
 * Processa operação de atualização
 */
function handleUpdate(op) {
  const taskId = op.taskId;
  const data = op.data || {};
  const version = data.version || 1;
  
  const result = Task.update(taskId, data, version);
  
  if (!result.success) {
    if (result.error === 'not_found') {
      return { success: false, error: 'Tarefa não encontrada' };
    }
    if (result.error === 'conflict') {
      return { success: false, conflict: true, serverTask: result.serverTask };
    }
  }
  
  return { success: true, task: result.task };
}

/**
 * Processa operação de deleção
 */
function handleDelete(op) {
  const taskId = op.taskId;
  Task.delete(taskId);
  // Retorna sucesso mesmo se não existir (idempotência)
  return { success: true };
}

module.exports = {
  batch
};





