const AWS = require('aws-sdk');

const awsConfig = {
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  s3ForcePathStyle: true
};

AWS.config.update(awsConfig);

const BUCKET_NAME = process.env.BUCKET_NAME || 'task-images';
const TABLE_NAME = process.env.TABLE_NAME || 'Tasks';
const TOPIC_ARN = process.env.TOPIC_ARN || 'arn:aws:sns:us-east-1:000000000000:task-notifications';

module.exports = {
  awsConfig,
  BUCKET_NAME,
  TABLE_NAME,
  TOPIC_ARN
};

