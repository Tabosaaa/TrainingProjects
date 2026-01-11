const { listImages, BUCKET_NAME } = require('../utils/s3');
const { getQueueStats, QUEUE_NAME } = require('../utils/sqs');
const { listTopics } = require('../utils/sns');

const USE_LOCALSTACK = process.env.USE_LOCALSTACK === 'true';

function check(req, res) {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    message: 'Task Manager API is running',
    localstack: USE_LOCALSTACK ? 'enabled' : 'disabled'
  });
}

async function localstackStatus(req, res) {
  if (!USE_LOCALSTACK) {
    return res.json({
      enabled: false,
      message: 'LocalStack não está habilitado'
    });
  }
  
  try {
    const [images, queueStats, topics] = await Promise.all([
      listImages().catch(() => []),
      getQueueStats().catch(() => null),
      listTopics().catch(() => [])
    ]);
    
    res.json({
      enabled: true,
      status: 'ok',
      services: {
        s3: {
          bucket: BUCKET_NAME,
          imagesCount: images.length
        },
        sqs: {
          queue: QUEUE_NAME,
          messagesAvailable: queueStats?.messagesAvailable || 0,
          messagesInFlight: queueStats?.messagesInFlight || 0
        },
        sns: {
          topicsCount: topics.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      enabled: true,
      status: 'error',
      error: error.message
    });
  }
}

module.exports = {
  check,
  localstackStatus
};
