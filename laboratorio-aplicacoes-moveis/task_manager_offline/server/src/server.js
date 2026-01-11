/**
 * Entry Point - Task Manager API
 * 
 * Inicializa o servidor Express e configura a aplicação.
 */

const app = require('./app');
const db = require('./config/database');

const PORT = process.env.PORT || 3000;

// Inicializar banco de dados e depois iniciar servidor
db.initialize().then(() => {
  app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║            Task Manager API - MVC Architecture             ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║  🚀 Servidor rodando em: http://localhost:${PORT}             ║`);
    console.log('║                                                             ║');
    console.log('║  Endpoints:                                                 ║');
    console.log('║  • GET    /api/health        - Health check                ║');
    console.log('║  • GET    /api/tasks         - Listar tarefas              ║');
    console.log('║  • POST   /api/tasks         - Criar tarefa                ║');
    console.log('║  • PUT    /api/tasks/:id     - Atualizar tarefa            ║');
    console.log('║  • DELETE /api/tasks/:id     - Deletar tarefa              ║');
    console.log('║  • POST   /api/sync/batch    - Sincronização em lote       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
  });
}).catch(err => {
  console.error('❌ Erro ao inicializar banco de dados:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Encerrando servidor...');
  db.close();
  process.exit(0);
});
