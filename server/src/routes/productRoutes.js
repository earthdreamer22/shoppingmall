const express = require('express');
const { listProducts, getProduct } = require('../controllers/productController');
const { validateObjectId } = require('../middleware/objectIdValidator');

const router = express.Router();

router.get('/', listProducts);
router.get('/:productId', validateObjectId('productId'), getProduct);

module.exports = router;
