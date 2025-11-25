const express = require('express');
const {
  createProduct,
  updateProduct,
  deleteProduct,
  listProducts,
  getProduct,
} = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/objectIdValidator');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/', listProducts);
router.get('/:productId', validateObjectId('productId'), getProduct);
router.post('/', createProduct);
router.put('/:productId', validateObjectId('productId'), updateProduct);
router.delete('/:productId', validateObjectId('productId'), deleteProduct);

module.exports = router;
