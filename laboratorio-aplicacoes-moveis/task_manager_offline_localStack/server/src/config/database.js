const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'tasks.db');

let db = null;
let SQL = null;

async function initialize() {
  SQL = await initSqlJs();
  
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('✅ Banco de dados carregado:', DB_PATH);
  } else {
    db = new SQL.Database();
    console.log('✅ Novo banco de dados criado:', DB_PATH);
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      completed INTEGER DEFAULT 0,
      priority TEXT DEFAULT 'medium',
      user_id TEXT NOT NULL,
      image_url TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      version INTEGER DEFAULT 1
    )
  `);
  
  // Migração: adicionar coluna image_url se não existir
  try {
    db.run(`ALTER TABLE tasks ADD COLUMN image_url TEXT`);
    console.log('✅ Coluna image_url adicionada');
  } catch (e) {
    // Coluna já existe, ignorar
  }
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at)`);
  
  save();
  
  console.log('✅ Banco de dados inicializado');
}

function getDatabase() {
  if (!db) {
    throw new Error('Banco de dados não inicializado. Chame initialize() primeiro.');
  }
  return db;
}

function save() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

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
