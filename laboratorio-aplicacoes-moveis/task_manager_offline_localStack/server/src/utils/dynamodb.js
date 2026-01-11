const AWS = require('aws-sdk');
const { awsConfig, TABLE_NAME } = require('../config/aws');

const dynamodb = new AWS.DynamoDB.DocumentClient(awsConfig);
const dynamodbRaw = new AWS.DynamoDB(awsConfig);

async function putTask(task) {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      id: task.id,
      userId: task.userId || 'user1',
      title: task.title,
      description: task.description || '',
      completed: task.completed || false,
      priority: task.priority || 'medium',
      imageUrl: task.imageUrl || null,
      createdAt: task.createdAt || Date.now(),
      updatedAt: Date.now(),
      version: task.version || 1
    }
  };

  try {
    await dynamodb.put(params).promise();
    console.log(`✅ Tarefa salva no DynamoDB: ${task.id}`);
    return params.Item;
  } catch (error) {
    console.error('❌ Erro ao salvar tarefa no DynamoDB:', error);
    throw error;
  }
}

async function getTask(id) {
  const params = {
    TableName: TABLE_NAME,
    Key: { id }
  };

  try {
    const result = await dynamodb.get(params).promise();
    return result.Item || null;
  } catch (error) {
    console.error('❌ Erro ao buscar tarefa:', error);
    throw error;
  }
}

async function getTasksByUser(userId) {
  const params = {
    TableName: TABLE_NAME,
    FilterExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  };

  try {
    const result = await dynamodb.scan(params).promise();
    return result.Items || [];
  } catch (error) {
    console.error('❌ Erro ao buscar tarefas:', error);
    throw error;
  }
}

async function updateTask(id, updates) {
  const updateExpressionParts = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  Object.keys(updates).forEach((key, index) => {
    const attrName = `#attr${index}`;
    const attrValue = `:val${index}`;
    updateExpressionParts.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrValue] = updates[key];
  });

  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = Date.now();
  updateExpressionParts.push('#updatedAt = :updatedAt');

  const params = {
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  };

  try {
    const result = await dynamodb.update(params).promise();
    console.log(`✅ Tarefa atualizada no DynamoDB: ${id}`);
    return result.Attributes;
  } catch (error) {
    console.error('❌ Erro ao atualizar tarefa:', error);
    throw error;
  }
}

async function deleteTask(id) {
  const params = {
    TableName: TABLE_NAME,
    Key: { id }
  };

  try {
    await dynamodb.delete(params).promise();
    console.log(`🗑️ Tarefa deletada do DynamoDB: ${id}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao deletar tarefa:', error);
    throw error;
  }
}

async function ensureTableExists() {
  try {
    await dynamodbRaw.describeTable({ TableName: TABLE_NAME }).promise();
    console.log(`✅ Tabela existe: ${TABLE_NAME}`);
    return true;
  } catch (error) {
    if (error.code === 'ResourceNotFoundException') {
      try {
        await dynamodbRaw.createTable({
          TableName: TABLE_NAME,
          KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
          ],
          AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' }
          ],
          BillingMode: 'PAY_PER_REQUEST'
        }).promise();
        console.log(`✅ Tabela criada: ${TABLE_NAME}`);
        return true;
      } catch (createError) {
        console.error('❌ Erro ao criar tabela:', createError);
        return false;
      }
    }
    return false;
  }
}

module.exports = {
  putTask,
  getTask,
  getTasksByUser,
  updateTask,
  deleteTask,
  ensureTableExists,
  TABLE_NAME
};

