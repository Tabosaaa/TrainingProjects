/**
 * Database Configuration
 * 
 * Configuração e inicialização do banco de dados SQLite usando sql.js
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'tasks.db');

let db = null;
let SQL = null;

/**
 * Inicializa o banco de dados e cria as tabelas
 */
async function initialize() {
  SQL = await initSqlJs();
  
  // Criar diretório data se não existir
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Carregar banco existente ou criar novo
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('✅ Banco de dados carregado:', DB_PATH);
  } else {
    db = new SQL.Database();
    console.log('✅ Novo banco de dados criado:', DB_PATH);
  }
  
  // Criar tabela de tarefas
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      completed INTEGER DEFAULT 0,
      priority TEXT DEFAULT 'medium',
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      version INTEGER DEFAULT 1
    )
  `);
  
  // Criar índices
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at)`);
  
  // Salvar banco
  save();
  
  console.log('✅ Banco de dados inicializado');
}

/**
 * Obtém a instância do banco de dados
 */
function getDatabase() {
  if (!db) {
    throw new Error('Banco de dados não inicializado. Chame initialize() primeiro.');
  }
  return db;
}

/**
 * Salva o banco de dados no disco
 */
function save() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

/**
 * Fecha a conexão com o banco de dados
 */
function close() {
  if (db) {
    save();
    db.close();
    db = null;
    console.log('🔒 Banco de dados fechado');
  }
}

module.exports = {
  initialize,
  getDatabase,
  save,
  close
};
