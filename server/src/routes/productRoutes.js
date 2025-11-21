const express = require('express');
const { listProducts, getProduct } = require('../controllers/productController');

const router = express.Router();

router.get('/', listProducts);
router.get('/:productId', getProduct);

module.exports = router;
