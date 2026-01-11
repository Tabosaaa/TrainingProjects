const AWS = require('aws-sdk');

const config = {
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  accessKeyId: 'test',
  secretAccessKey: 'test',
  s3ForcePathStyle: true
};

const s3 = new AWS.S3(config);
const dynamodb = new AWS.DynamoDB(config);
const sns = new AWS.SNS(config);
const sqs = new AWS.SQS(config);

const BUCKET_NAME = 'task-images';
const TABLE_NAME = 'Tasks';
const TOPIC_NAME = 'task-notifications';
const QUEUE_NAME = 'task-processing-queue';

async function createBucket() {
  try {
    await s3.createBucket({ Bucket: BUCKET_NAME }).promise();
    console.log(`✅ Bucket S3 criado: ${BUCKET_NAME}`);
    
    await s3.putBucketCors({
      Bucket: BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [{
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE'],
          AllowedOrigins: ['*'],
          ExposeHeaders: ['ETag']
        }]
      }
    }).promise();
    console.log(`✅ CORS configurado para bucket`);
  } catch (error) {
    if (error.code === 'BucketAlreadyOwnedByYou' || error.code === 'BucketAlreadyExists') {
      console.log(`⚠️ Bucket ${BUCKET_NAME} já existe`);
    } else {
      throw error;
    }
  }
}

async function createTable() {
  try {
    await dynamodb.createTable({
      TableName: TABLE_NAME,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    }).promise();
    console.log(`✅ Tabela DynamoDB criada: ${TABLE_NAME}`);
    
    await dynamodb.waitFor('tableExists', { TableName: TABLE_NAME }).promise();
    console.log(`✅ Tabela pronta para uso`);
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log(`⚠️ Tabela ${TABLE_NAME} já existe`);
    } else {
      throw error;
    }
  }
}

async function createTopic() {
  try {
    const result = await sns.createTopic({ Name: TOPIC_NAME }).promise();
    console.log(`✅ Tópico SNS criado: ${result.TopicArn}`);
    return result.TopicArn;
  } catch (error) {
    console.error('❌ Erro ao criar tópico:', error);
    throw error;
  }
}

async function createQueue() {
  try {
    const result = await sqs.createQueue({
      QueueName: QUEUE_NAME,
      Attributes: {
        DelaySeconds: '0',
        MessageRetentionPeriod: '86400',
        VisibilityTimeout: '30'
      }
    }).promise();
    console.log(`✅ Fila SQS criada: ${result.QueueUrl}`);
    return result.QueueUrl;
  } catch (error) {
    if (error.code === 'QueueAlreadyExists') {
      console.log(`⚠️ Fila ${QUEUE_NAME} já existe`);
      const urlResult = await sqs.getQueueUrl({ QueueName: QUEUE_NAME }).promise();
      return urlResult.QueueUrl;
    }
    console.error('❌ Erro ao criar fila:', error);
    throw error;
  }
}

async function listResources() {
  console.log('\n📋 Recursos LocalStack:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const buckets = await s3.listBuckets().promise();
  console.log('\n🪣 Buckets S3:');
  buckets.Buckets.forEach(b => console.log(`   • ${b.Name}`));
  
  const tables = await dynamodb.listTables().promise();
  console.log('\n📊 Tabelas DynamoDB:');
  tables.TableNames.forEach(t => console.log(`   • ${t}`));
  
  const topics = await sns.listTopics().promise();
  console.log('\n📢 Tópicos SNS:');
  topics.Topics.forEach(t => console.log(`   • ${t.TopicArn}`));
  
  const queues = await sqs.listQueues().promise();
  console.log('\n📨 Filas SQS:');
  if (queues.QueueUrls) {
    queues.QueueUrls.forEach(q => console.log(`   • ${q}`));
  } else {
    console.log('   (nenhuma fila encontrada)');
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           Inicializando Recursos LocalStack               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    console.log('🔄 Verificando conexão com LocalStack...');
    await s3.listBuckets().promise();
    console.log('✅ LocalStack está acessível\n');
    
    await createBucket();
    await createTable();
    await createTopic();
    await createQueue();
    
    await listResources();
    
    console.log('\n✅ LocalStack inicializado com sucesso!\n');
    console.log('Próximos passos:');
    console.log('  1. npm start           - Iniciar o servidor');
    console.log('  2. flutter run         - Iniciar o app mobile\n');
    
  } catch (error) {
    console.error('\n❌ Erro ao inicializar LocalStack:', error.message);
    console.error('\n⚠️  Verifique se:');
    console.error('   1. Docker está rodando');
    console.error('   2. LocalStack está ativo (docker-compose up -d)');
    console.error('   3. Porta 4566 está acessível\n');
    process.exit(1);
  }
}

main();

