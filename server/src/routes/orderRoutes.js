const express = require('express');
const {
  listOrders,
  createOrder,
  createGuestOrder,
  createOrderDraft,
  createGuestOrderDraft,
  confirmOrderPayment,
  lookupGuestOrder,
  cancelOrder,
} = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { createOrderSchema } = require('../validation/orderSchemas');
const { guestOrderLimiter } = require('../middleware/authRateLimiter');

const router = express.Router();

// 비회원: 인증 없이 접근 (CSRF 예외 처리됨)
router.post('/guest', guestOrderLimiter, createGuestOrder);
router.post('/guest/draft', guestOrderLimiter, createGuestOrderDraft);
router.post('/guest/confirm', guestOrderLimiter, confirmOrderPayment);
router.post('/guest/lookup', guestOrderLimiter, lookupGuestOrder);

// 회원: 카드 결제는 draft(결제 전 저장) -> confirm(결제 후 확정) 순서로 호출한다.
router.post('/draft', authenticate, createOrderDraft);
router.post('/confirm', authenticate, confirmOrderPayment);

router.get('/', authenticate, listOrders);
router.post('/', authenticate, validate(createOrderSchema), createOrder);
router.delete('/:orderId', authenticate, cancelOrder);

module.exports = router;
