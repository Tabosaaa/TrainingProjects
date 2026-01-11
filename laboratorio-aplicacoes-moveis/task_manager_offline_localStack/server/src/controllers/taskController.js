const Task = require('../models/Task');
const { uploadImage, deleteTaskImages } = require('../utils/s3');
const { putTask: saveToDynamo, deleteTask: deleteFromDynamo } = require('../utils/dynamodb');
const { publishTaskEvent } = require('../utils/sns');
const { sendMessage: sendToSQS } = require('../utils/sqs');
const { v4: uuidv4 } = require('uuid');

const USE_LOCALSTACK = process.env.USE_LOCALSTACK === 'true';

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

async function create(req, res) {
  try {
    const data = req.body;
    
    if (data.id) {
      const existing = Task.findById(data.id);
      if (existing) {
        console.log(`⚠️ Tarefa ${data.id} já existe, retornando existente`);
        return res.status(200).json({ task: existing });
      }
    }
    
    let imageUrl = null;
    if (data.imageBase64) {
      try {
        const base64Data = data.imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const taskId = data.id || uuidv4();
        const key = `tasks/${taskId}/${Date.now()}.jpg`;
        
        const uploadResult = await uploadImage(key, imageBuffer, 'image/jpeg');
        imageUrl = uploadResult.url;
        console.log(`📷 Imagem salva no S3: ${imageUrl}`);
      } catch (uploadError) {
        console.error('⚠️ Erro no upload da imagem (continuando sem imagem):', uploadError.message);
      }
    }
    
    const taskData = { ...data };
    if (imageUrl) {
      taskData.imageUrl = imageUrl;
    }
    delete taskData.imageBase64;
    
    const task = Task.create(taskData);
    
    if (USE_LOCALSTACK) {
      try {
        await saveToDynamo(task);
        await publishTaskEvent('TASK_CREATED', task);
        await sendToSQS('TASK_CREATED', {
          taskId: task.id,
          title: task.title,
          userId: task.userId,
          hasImage: !!imageUrl,
          action: 'create'
        });
      } catch (awsError) {
        console.error('⚠️ Erro ao salvar no LocalStack:', awsError.message);
      }
    }
    
    res.status(201).json({ task });
  } catch (error) {
    console.error('❌ Erro ao criar tarefa:', error.message);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const clientVersion = data.version || 1;
    
    let imageUrl = null;
    if (data.imageBase64) {
      try {
        const base64Data = data.imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const key = `tasks/${id}/${Date.now()}.jpg`;
        
        const uploadResult = await uploadImage(key, imageBuffer, 'image/jpeg');
        imageUrl = uploadResult.url;
        console.log(`📷 Imagem atualizada no S3: ${imageUrl}`);
      } catch (uploadError) {
        console.error('⚠️ Erro no upload da imagem:', uploadError.message);
      }
    }
    
    const updateData = { ...data };
    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }
    delete updateData.imageBase64;
    
    const result = Task.update(id, updateData, clientVersion);
    
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
    
    if (USE_LOCALSTACK) {
      try {
        await saveToDynamo(result.task);
        await publishTaskEvent('TASK_UPDATED', result.task);
        await sendToSQS('TASK_UPDATED', {
          taskId: result.task.id,
          title: result.task.title,
          userId: result.task.userId,
          hasImage: !!result.task.imageUrl,
          action: 'update'
        });
      } catch (awsError) {
        console.error('⚠️ Erro ao atualizar no LocalStack:', awsError.message);
      }
    }
    
    res.json({ task: result.task });
  } catch (error) {
    console.error('❌ Erro ao atualizar tarefa:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
}

async function destroy(req, res) {
  try {
    const { id } = req.params;
    const task = Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    // Deletar do banco local
    const deleted = Task.delete(id);
    
    if (USE_LOCALSTACK && deleted) {
      try {
        // Deletar imagens do S3
        console.log(`🗑️ Deletando dados da task ${id} do LocalStack...`);
        const s3Result = await deleteTaskImages(id);
        console.log(`   ✅ S3: ${s3Result.deletedCount} imagem(s) deletada(s)`);
        
        // Deletar do DynamoDB
        await deleteFromDynamo(id);
        console.log(`   ✅ DynamoDB: tarefa deletada`);
        
        // Publicar evento de deleção
        await publishTaskEvent('TASK_DELETED', task);
        await sendToSQS('TASK_DELETED', {
          taskId: task.id,
          title: task.title,
          userId: task.userId,
          action: 'delete',
          imagesDeleted: s3Result.deletedCount
        });
        console.log(`   ✅ SNS/SQS: eventos publicados`);
        
      } catch (awsError) {
        console.error('⚠️ Erro ao deletar do LocalStack:', awsError.message);
      }
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
