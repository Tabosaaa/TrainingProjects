const { uploadImage, listImages, deleteImage, BUCKET_NAME } = require('../utils/s3');
const { awsConfig } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');

async function upload(req, res) {
  try {
    const { imageBase64, taskId, fileName } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 é obrigatório' });
    }
    
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    const extension = fileName?.split('.').pop() || 'jpg';
    const key = `tasks/${taskId || uuidv4()}/${Date.now()}.${extension}`;
    
    const result = await uploadImage(key, imageBuffer, `image/${extension}`);
    
    res.status(201).json({
      success: true,
      imageUrl: result.url,
      key: key,
      bucket: BUCKET_NAME
    });
  } catch (error) {
    console.error('❌ Erro no upload:', error.message);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
}

async function list(req, res) {
  try {
    const { prefix = '' } = req.query;
    const images = await listImages(prefix);
    
    const imageUrls = images.map(img => ({
      key: img.Key,
      url: `${awsConfig.endpoint}/${BUCKET_NAME}/${img.Key}`,
      size: img.Size,
      lastModified: img.LastModified
    }));
    
    res.json({ images: imageUrls, count: imageUrls.length });
  } catch (error) {
    console.error('❌ Erro ao listar imagens:', error.message);
    res.status(500).json({ error: 'Erro ao listar imagens' });
  }
}

async function remove(req, res) {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({ error: 'key é obrigatório' });
    }
    
    const decodedKey = decodeURIComponent(key);
    await deleteImage(decodedKey);
    
    res.json({ success: true, message: 'Imagem deletada' });
  } catch (error) {
    console.error('❌ Erro ao deletar imagem:', error.message);
    res.status(500).json({ error: 'Erro ao deletar imagem' });
  }
}

module.exports = {
  upload,
  list,
  remove
};

