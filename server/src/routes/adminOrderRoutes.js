const express = require('express');
const { listAllOrders, cancelOrder, updateOrderStatus } = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/', listAllOrders);
router.delete('/:orderId', cancelOrder);
router.patch('/:orderId/status', updateOrderStatus);

module.exports = router;
