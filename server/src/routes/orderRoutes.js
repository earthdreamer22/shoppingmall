const express = require('express');
const { listOrders, createOrder, cancelOrder } = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, listOrders);
router.post('/', authenticate, createOrder);
router.delete('/:orderId', authenticate, cancelOrder);

module.exports = router;
