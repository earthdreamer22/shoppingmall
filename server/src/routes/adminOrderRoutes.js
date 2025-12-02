const express = require('express');
const { listAllOrders, cancelOrder, updateOrderStatus } = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/objectIdValidator');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/', listAllOrders);
router.post('/:orderId/cancel', validateObjectId('orderId'), cancelOrder);
router.patch('/:orderId/status', validateObjectId('orderId'), updateOrderStatus);

module.exports = router;
