const { asyncHandler } = require('../utils/asyncHandler');
const Order = require('../models/Order');
const { getPaymentByImpUid } = require('../services/portoneService');
const { recordAuditLog } = require('../utils/auditLogger');
const { config } = require('../config/env');

const verifyWebhookSecret = (req) => {
  if (!config.portone.webhookSecret) return true;
  const header = req.get('x-webhook-secret');
  return header === config.portone.webhookSecret;
};

const handleWebhook = asyncHandler(async (req, res) => {
  if (!verifyWebhookSecret(req)) {
    return res.status(403).json({ message: '유효하지 않은 웹훅 시크릿입니다.' });
  }

  const { imp_uid: impUid, merchant_uid: merchantUid } = req.body ?? {};
  if (!impUid || !merchantUid) {
    return res.status(400).json({ message: 'imp_uid와 merchant_uid가 필요합니다.' });
  }

  const payment = await getPaymentByImpUid(impUid);

  if (payment.merchant_uid !== merchantUid) {
    return res.status(400).json({ message: '결제 정보가 주문 정보와 일치하지 않습니다.' });
  }

  const order = await Order.findOne({ 'payment.merchantUid': merchantUid });
  if (!order) {
    return res.status(404).json({ message: '해당 주문을 찾을 수 없습니다.' });
  }

  const paidAmount = Math.round(payment.amount ?? 0);
  const orderTotal = Math.round(order.pricing?.total ?? 0);
  if (paidAmount !== orderTotal) {
    return res.status(400).json({ message: '결제 금액이 주문 금액과 일치하지 않습니다.' });
  }

  const paymentStatus = payment.status;
  if (paymentStatus === 'paid') {
    order.status = order.status === 'pending' ? 'paid' : order.status;
    order.payment.status = 'paid';
    order.payment.paidAt = payment.paid_at ? new Date(payment.paid_at * 1000) : new Date();
  } else if (paymentStatus === 'cancelled') {
    order.status = 'cancelled';
    order.payment.status = 'refunded';
  } else if (paymentStatus === 'failed') {
    order.payment.status = 'failed';
  }

  order.payment.impUid = payment.imp_uid;
  order.payment.transactionId = payment.pg_tid ?? order.payment.transactionId;
  order.payment.pgProvider = payment.pg_provider ?? order.payment.pgProvider;
  order.payment.cardName = payment.card_name ?? order.payment.cardName;
  order.payment.applyNum = payment.apply_num ?? order.payment.applyNum;

  order.history.push({
    status: order.status,
    note: `포트원 웹훅 처리(${paymentStatus})`,
  });

  await order.save();

  await recordAuditLog({
    action: 'payment.webhook',
    userId: order.user,
    ip: req.ip,
    metadata: { orderId: order.id, status: paymentStatus, impUid },
  });

  res.json({ success: true });
});

module.exports = {
  handleWebhook,
};
