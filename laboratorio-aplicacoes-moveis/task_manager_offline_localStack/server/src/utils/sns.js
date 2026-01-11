const AWS = require('aws-sdk');
const { awsConfig, TOPIC_ARN } = require('../config/aws');

const sns = new AWS.SNS(awsConfig);
const TOPIC_NAME = 'task-notifications';

async function publishTaskEvent(eventType, task) {
  const message = {
    eventType,
    taskId: task.id,
    title: task.title,
    userId: task.userId,
    timestamp: Date.now()
  };

  const params = {
    TopicArn: TOPIC_ARN,
    Message: JSON.stringify(message),
    Subject: `Task ${eventType}: ${task.title}`,
    MessageAttributes: {
      eventType: {
        DataType: 'String',
        StringValue: eventType
      },
      taskId: {
        DataType: 'String',
        StringValue: task.id
      }
    }
  };

  try {
    console.log(`📢 Publicando evento SNS: ${eventType}`);
    const result = await sns.publish(params).promise();
    console.log(`✅ Evento publicado. MessageId: ${result.MessageId}`);
    return result;
  } catch (error) {
    console.error('❌ Erro ao publicar evento SNS:', error);
    // Não lançar erro para não quebrar o fluxo principal
    return null;
  }
}

async function ensureTopicExists() {
  try {
    const result = await sns.createTopic({ Name: TOPIC_NAME }).promise();
    console.log(`✅ Tópico SNS: ${result.TopicArn}`);
    return result.TopicArn;
  } catch (error) {
    console.error('❌ Erro ao criar tópico SNS:', error);
    return null;
  }
}

async function listTopics() {
  try {
    const result = await sns.listTopics().promise();
    return result.Topics || [];
  } catch (error) {
    console.error('❌ Erro ao listar tópicos:', error);
    return [];
  }
}

module.exports = {
  publishTaskEvent,
  ensureTopicExists,
  listTopics,
  TOPIC_NAME
};

