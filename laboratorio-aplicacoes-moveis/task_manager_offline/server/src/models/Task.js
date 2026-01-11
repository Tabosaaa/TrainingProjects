/**
 * Task Model
 * 
 * Operações de banco de dados para a entidade Task.
 */

const { getDatabase, save } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Task {
  /**
   * Busca todas as tarefas de um usuário
   * @param {string} userId - ID do usuário
   * @param {number|null} modifiedSince - Timestamp para sync incremental
   * @returns {Array} Lista de tarefas
   */
  static findByUser(userId, modifiedSince = null) {
    const db = getDatabase();
    
    let sql = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [userId];
    
    if (modifiedSince) {
      sql += ' AND updated_at > ?';
      params.push(modifiedSince);
    }
    
    sql += ' ORDER BY updated_at DESC';
    
    const stmt = db.prepare(sql);
    stmt.bind(params);
    
    const rows = [];
    while (stmt.step()) {
      rows.push(Task.fromRow(stmt.getAsObject()));
    }
    stmt.free();
    
    return rows;
  }
  
  /**
   * Busca uma tarefa por ID
   * @param {string} id - ID da tarefa
   * @returns {Object|null} Tarefa ou null
   */
  static findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
    stmt.bind([id]);
    
    let result = null;
    if (stmt.step()) {
      result = Task.fromRow(stmt.getAsObject());
    }
    stmt.free();
    
    return result;
  }
  
  /**
   * Cria uma nova tarefa
   * @param {Object} data - Dados da tarefa
   * @returns {Object} Tarefa criada
   */
  static create(data) {
    const db = getDatabase();
    const now = Date.now();
    
    const task = {
      id: data.id || uuidv4(),
      title: data.title,
      description: data.description || '',
      completed: data.completed ? 1 : 0,
      priority: data.priority || 'medium',
      userId: data.userId || 'user1',
      createdAt: data.createdAt || now,
      updatedAt: now,
      version: 1
    };
    
    db.run(`
      INSERT INTO tasks (id, title, description, completed, priority, user_id, created_at, updated_at, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      task.id,
      task.title,
      task.description,
      task.completed,
      task.priority,
      task.userId,
      task.createdAt,
      task.updatedAt,
      task.version
    ]);
    
    save();
    console.log(`✅ Tarefa criada: ${task.title} (${task.id})`);
    
    return {
      ...task,
      completed: task.completed === 1
    };
  }
  
  /**
   * Atualiza uma tarefa existente
   * @param {string} id - ID da tarefa
   * @param {Object} data - Dados para atualização
   * @param {number} clientVersion - Versão do cliente para optimistic locking
   * @returns {Object} Resultado da operação
   */
  static update(id, data, clientVersion) {
    const db = getDatabase();
    const existing = Task.findById(id);
    
    if (!existing) {
      return { success: false, error: 'not_found' };
    }
    
    // Verificar conflito de versão
    if (existing.version > clientVersion) {
      console.log(`⚠️ Conflito de versão para tarefa ${id}:`);
      console.log(`   Servidor: v${existing.version}, Cliente: v${clientVersion}`);
      return { 
        success: false, 
        error: 'conflict', 
        serverTask: existing 
      };
    }
    
    const now = Date.now();
    const newVersion = existing.version + 1;
    
    db.run(`
      UPDATE tasks 
      SET title = ?, description = ?, completed = ?, priority = ?, updated_at = ?, version = ?
      WHERE id = ?
    `, [
      data.title ?? existing.title,
      data.description ?? existing.description,
      data.completed !== undefined ? (data.completed ? 1 : 0) : (existing.completed ? 1 : 0),
      data.priority ?? existing.priority,
      now,
      newVersion,
      id
    ]);
    
    save();
    
    const updated = Task.findById(id);
    console.log(`✅ Tarefa atualizada: ${updated.title} (v${updated.version})`);
    
    return { success: true, task: updated };
  }
  
  /**
   * Deleta uma tarefa
   * @param {string} id - ID da tarefa
   * @returns {boolean} Se a tarefa foi deletada
   */
  static delete(id) {
    const db = getDatabase();
    const existing = Task.findById(id);
    
    if (!existing) {
      return false;
    }
    
    db.run('DELETE FROM tasks WHERE id = ?', [id]);
    save();
    
    console.log(`🗑️ Tarefa deletada: ${existing.title}`);
    return true;
  }
  
  /**
   * Converte uma row do banco para objeto Task
   * @param {Object} row - Row do SQLite
   * @returns {Object} Objeto Task formatado
   */
  static fromRow(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      completed: row.completed === 1,
      priority: row.priority,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version
    };
  }
}

module.exports = Task;
