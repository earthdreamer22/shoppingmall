const express = require('express');
const { listOrders, createOrder, createGuestOrder, lookupGuestOrder, cancelOrder } = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { createOrderSchema } = require('../validation/orderSchemas');
const { guestOrderLimiter } = require('../middleware/authRateLimiter');

const router = express.Router();

// 비회원 주문: 인증 없이 접근 (CSRF 예외 처리됨)
router.post('/guest', guestOrderLimiter, createGuestOrder);
router.post('/guest/lookup', guestOrderLimiter, lookupGuestOrder);

router.get('/', authenticate, listOrders);
router.post('/', authenticate, validate(createOrderSchema), createOrder);
router.delete('/:orderId', authenticate, cancelOrder);

module.exports = router;
