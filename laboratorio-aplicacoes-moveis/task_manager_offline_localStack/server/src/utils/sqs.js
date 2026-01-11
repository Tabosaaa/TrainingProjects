const AWS = require('aws-sdk');
const { awsConfig } = require('../config/aws');

const sqs = new AWS.SQS(awsConfig);
const QUEUE_NAME = 'task-processing-queue';
let queueUrl = null;

async function getQueueUrl() {
  if (queueUrl) return queueUrl;
  
  try {
    const result = await sqs.getQueueUrl({ QueueName: QUEUE_NAME }).promise();
    queueUrl = result.QueueUrl;
    return queueUrl;
  } catch (error) {
    if (error.code === 'AWS.SimpleQueueService.NonExistentQueue') {
      return null;
    }
    throw error;
  }
}

async function sendMessage(eventType, payload) {
  const url = await getQueueUrl();
  if (!url) {
    console.log('⚠️ Fila SQS não encontrada, pulando envio');
    return null;
  }
  
  const message = {
    eventType,
    payload,
    timestamp: Date.now(),
    messageId: `msg-${Date.now()}`
  };
  
  const params = {
    QueueUrl: url,
    MessageBody: JSON.stringify(message),
    MessageAttributes: {
      EventType: {
        DataType: 'String',
        StringValue: eventType
      }
    }
  };
  
  try {
    console.log(`📨 Enviando mensagem SQS: ${eventType}`);
    const result = await sqs.sendMessage(params).promise();
    console.log(`✅ Mensagem enviada: ${result.MessageId}`);
    return result;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem SQS:', error);
    return null;
  }
}

async function receiveMessages(maxMessages = 10) {
  const url = await getQueueUrl();
  if (!url) return [];
  
  const params = {
    QueueUrl: url,
    MaxNumberOfMessages: maxMessages,
    WaitTimeSeconds: 5,
    MessageAttributeNames: ['All']
  };
  
  try {
    const result = await sqs.receiveMessage(params).promise();
    return result.Messages || [];
  } catch (error) {
    console.error('❌ Erro ao receber mensagens SQS:', error);
    return [];
  }
}

async function deleteMessage(receiptHandle) {
  const url = await getQueueUrl();
  if (!url) return false;
  
  try {
    await sqs.deleteMessage({
      QueueUrl: url,
      ReceiptHandle: receiptHandle
    }).promise();
    console.log('🗑️ Mensagem deletada da fila');
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar mensagem:', error);
    return false;
  }
}

async function getQueueStats() {
  const url = await getQueueUrl();
  if (!url) return null;
  
  try {
    const result = await sqs.getQueueAttributes({
      QueueUrl: url,
      AttributeNames: ['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible']
    }).promise();
    
    return {
      messagesAvailable: parseInt(result.Attributes.ApproximateNumberOfMessages) || 0,
      messagesInFlight: parseInt(result.Attributes.ApproximateNumberOfMessagesNotVisible) || 0
    };
  } catch (error) {
    console.error('❌ Erro ao obter stats da fila:', error);
    return null;
  }
}

async function ensureQueueExists() {
  try {
    const url = await getQueueUrl();
    if (url) {
      console.log(`✅ Fila SQS existe: ${QUEUE_NAME}`);
      return url;
    }
    
    const result = await sqs.createQueue({
      QueueName: QUEUE_NAME,
      Attributes: {
        DelaySeconds: '0',
        MessageRetentionPeriod: '86400',
        VisibilityTimeout: '30'
      }
    }).promise();
    
    queueUrl = result.QueueUrl;
    console.log(`✅ Fila SQS criada: ${QUEUE_NAME}`);
    return queueUrl;
  } catch (error) {
    console.error('❌ Erro ao criar fila SQS:', error);
    return null;
  }
}

module.exports = {
  sendMessage,
  receiveMessages,
  deleteMessage,
  getQueueStats,
  ensureQueueExists,
  QUEUE_NAME
};


