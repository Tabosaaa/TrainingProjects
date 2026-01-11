const { putTask } = require('../utils/dynamodb');
const { uploadImage } = require('../utils/s3');

/**
 * Lambda de exemplo, escrita em Node.js, para processar eventos de tarefa.
 *
 * Esta função foi pensada para ser acionada de forma simples por:
 * - SNS ou SQS (eventos assíncronos)
 * - API Gateway HTTP (requisição HTTP direta)
 *
 * Estrutura esperada da mensagem:
 * {
 *   "eventType": "TASK_CREATED" | "TASK_UPDATED" | "TASK_DELETED",
 *   "task": {
 *     "id": "...",
 *     "title": "...",
 *     "description": "...",
 *     "completed": false,
 *     "priority": "medium",
 *     "userId": "user1",
 *     "imageBase64": "opcional, para upload no S3"
 *   }
 * }
 */
exports.handler = async (event) => {
  console.log('📨 Evento recebido na Lambda:');
  console.log(JSON.stringify(event, null, 2));

  // 1) Caso: chamado via API Gateway HTTP (sem Records)
  if (!event.Records && event.body) {
    try {
      const payload = typeof event.body === 'string'
        ? JSON.parse(event.body)
        : event.body;

      const result = await processSingleMessage(payload);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Evento processado pela Lambda',
          result,
        }),
      };
    } catch (err) {
      console.error('❌ Erro ao processar requisição HTTP na Lambda:', err);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Erro interno na Lambda', details: err.message }),
      };
    }
  }

  // 2) Caso: chamado por SNS/SQS (event.Records presente)
  const records = event.Records || [];

  for (const record of records) {
    try {
      // Suporta tanto SNS quanto SQS
      const rawMessage =
        record.Sns?.Message ??
        record.body ??
        record.message ??
        null;

      if (!rawMessage) {
        console.warn('⚠️ Registro sem mensagem reconhecida, ignorando.');
        continue;
      }

      const message = typeof rawMessage === 'string'
        ? JSON.parse(rawMessage)
        : rawMessage;

      await processSingleMessage(message);
    } catch (err) {
      console.error('❌ Erro ao processar registro na Lambda:', err);
    }
  }

  // Quando é invocada por SNS/SQS, não há resposta HTTP
  return;
};

async function processSingleMessage(message) {
  const { eventType, task } = message;

  if (!task || !task.id) {
    console.warn('⚠️ Mensagem sem task.id, ignorando.');
    return { ignored: true };
  }

  console.log(`➡️ Processando evento ${eventType} para tarefa ${task.id}`);

  // Se vier imageBase64 na mensagem, faz upload para S3
  if (task.imageBase64) {
    const base64Data = task.imageBase64.replace(/^data:image\/\\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const key = `tasks/${task.id}/${Date.now()}.jpg`;

    const uploadResult = await uploadImage(key, imageBuffer, 'image/jpeg');
    task.imageUrl = uploadResult.url;
    console.log(`📷 Imagem salva no S3 pela Lambda: ${task.imageUrl}`);

    // Remove o campo pesado da mensagem antes de salvar no DynamoDB
    delete task.imageBase64;
  }

  switch (eventType) {
    case 'TASK_CREATED':
    case 'TASK_UPDATED':
      // Salva/atualiza a tarefa no DynamoDB
      await putTask(task);
      console.log(`✅ Tarefa sincronizada no DynamoDB via Lambda: ${task.id}`);
      break;

    case 'TASK_DELETED':
      // Exemplo simples: apenas loga. Poderia chamar deleteTask do util de DynamoDB.
      console.log(`🗑️ Tarefa marcada como deletada (tratamento adicional pode ser implementado aqui): ${task.id}`);
      break;

    default:
      console.warn(`⚠️ eventType desconhecido: ${eventType}`);
  }

  return { success: true, eventType, taskId: task.id };
}



