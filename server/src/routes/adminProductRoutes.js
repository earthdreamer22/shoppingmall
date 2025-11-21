const express = require('express');
const {
  createProduct,
  updateProduct,
  deleteProduct,
  listProducts,
  getProduct,
} = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/', listProducts);
router.get('/:productId', getProduct);
router.post('/', createProduct);
router.put('/:productId', updateProduct);
router.delete('/:productId', deleteProduct);

module.exports = router;
