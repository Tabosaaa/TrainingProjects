const AWS = require('aws-sdk');
const { awsConfig, BUCKET_NAME } = require('../config/aws');

const s3 = new AWS.S3(awsConfig);

async function uploadImage(key, imageBuffer, contentType = 'image/jpeg') {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: imageBuffer,
    ContentType: contentType
  };

  try {
    console.log(`📤 Upload S3: ${BUCKET_NAME}/${key}`);
    const result = await s3.putObject(params).promise();
    const imageUrl = `${awsConfig.endpoint}/${BUCKET_NAME}/${key}`;
    console.log(`✅ Upload concluído: ${imageUrl}`);
    return { success: true, url: imageUrl, etag: result.ETag };
  } catch (error) {
    console.error('❌ Erro no upload S3:', error);
    throw error;
  }
}

async function getImageUrl(key) {
  return `${awsConfig.endpoint}/${BUCKET_NAME}/${key}`;
}

async function deleteImage(key) {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key
  };

  try {
    await s3.deleteObject(params).promise();
    console.log(`🗑️ Imagem deletada: ${key}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao deletar imagem:', error);
    throw error;
  }
}

async function deleteTaskImages(taskId) {
  try {
    const prefix = `tasks/${taskId}/`;
    const objects = await listImages(prefix);
    
    if (!objects || objects.length === 0) {
      console.log(`ℹ️ Nenhuma imagem encontrada para task ${taskId}`);
      return { success: true, deletedCount: 0 };
    }
    
    console.log(`🗑️ Deletando ${objects.length} imagem(s) da task ${taskId}...`);
    
    const deleteParams = {
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: objects.map(obj => ({ Key: obj.Key })),
        Quiet: false
      }
    };
    
    const result = await s3.deleteObjects(deleteParams).promise();
    console.log(`✅ ${result.Deleted.length} imagem(s) deletada(s) do S3`);
    
    return { success: true, deletedCount: result.Deleted.length };
  } catch (error) {
    console.error('❌ Erro ao deletar imagens da task:', error);
    throw error;
  }
}

async function listImages(prefix = '') {
  const params = {
    Bucket: BUCKET_NAME,
    Prefix: prefix
  };

  try {
    const result = await s3.listObjectsV2(params).promise();
    return result.Contents || [];
  } catch (error) {
    console.error('❌ Erro ao listar imagens:', error);
    throw error;
  }
}

async function ensureBucketExists() {
  try {
    await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
    console.log(`✅ Bucket existe: ${BUCKET_NAME}`);
    return true;
  } catch (error) {
    if (error.code === 'NotFound' || error.code === 'NoSuchBucket') {
      try {
        await s3.createBucket({ Bucket: BUCKET_NAME }).promise();
        console.log(`✅ Bucket criado: ${BUCKET_NAME}`);
        return true;
      } catch (createError) {
        console.error('❌ Erro ao criar bucket:', createError);
        return false;
      }
    }
    return false;
  }
}

module.exports = {
  uploadImage,
  getImageUrl,
  deleteImage,
  deleteTaskImages,
  listImages,
  ensureBucketExists,
  BUCKET_NAME
};

