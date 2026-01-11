const app = require('./app');
const db = require('./config/database');
const { ensureBucketExists } = require('./utils/s3');
const { ensureTableExists } = require('./utils/dynamodb');
const { ensureTopicExists } = require('./utils/sns');
const { ensureQueueExists } = require('./utils/sqs');

const PORT = process.env.PORT || 3000;
const USE_LOCALSTACK = process.env.USE_LOCALSTACK === 'true';

async function initializeAWS() {
  if (!USE_LOCALSTACK) {
    console.log('⚠️  LocalStack desabilitado (USE_LOCALSTACK=false)');
    return;
  }
  
  console.log('🔄 Inicializando recursos LocalStack...');
  
  try {
    await ensureBucketExists();
    await ensureTableExists();
    await ensureTopicExists();
    await ensureQueueExists();
    console.log('✅ Recursos LocalStack prontos');
  } catch (error) {
    console.error('⚠️  Erro ao inicializar LocalStack:', error.message);
    console.log('   O servidor continuará funcionando sem LocalStack');
  }
}

async function startServer() {
  try {
    await db.initialize();
    await initializeAWS();
    
    app.listen(PORT, () => {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║       Task Manager API - LocalStack Integration           ║');
      console.log('╠═══════════════════════════════════════════════════════════╣');
      console.log(`║  🚀 Servidor rodando em: http://localhost:${PORT}             ║`);
      console.log(`║  ☁️  LocalStack: ${USE_LOCALSTACK ? 'HABILITADO' : 'DESABILITADO'}                            ║`);
      console.log('║                                                             ║');
      console.log('║  Endpoints:                                                 ║');
      console.log('║  • GET    /api/health           - Health check             ║');
      console.log('║  • GET    /api/localstack       - Status LocalStack        ║');
      console.log('║  • GET    /api/tasks            - Listar tarefas           ║');
      console.log('║  • POST   /api/tasks            - Criar tarefa             ║');
      console.log('║  • PUT    /api/tasks/:id        - Atualizar tarefa         ║');
      console.log('║  • DELETE /api/tasks/:id        - Deletar tarefa           ║');
      console.log('║  • POST   /api/images/upload    - Upload de imagem (S3)    ║');
      console.log('║  • GET    /api/images           - Listar imagens           ║');
      console.log('║  • POST   /api/sync/batch       - Sincronização em lote    ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log('');
    });
  } catch (err) {
    console.error('❌ Erro ao inicializar:', err);
    process.exit(1);
  }
}

startServer();

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
