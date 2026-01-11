const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');

router.post('/upload', imageController.upload);
router.get('/', imageController.list);
router.delete('/:key(*)', imageController.remove);

module.exports = router;

