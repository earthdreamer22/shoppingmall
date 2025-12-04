const express = require('express');
const { listOrders, createOrder, cancelOrder } = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { createOrderSchema } = require('../validation/orderSchemas');

const router = express.Router();

router.get('/', authenticate, listOrders);
router.post('/', authenticate, validate(createOrderSchema), createOrder);
router.delete('/:orderId', authenticate, cancelOrder);

module.exports = router;
