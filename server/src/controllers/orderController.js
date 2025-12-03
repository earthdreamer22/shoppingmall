const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { asyncHandler } = require('../utils/asyncHandler');
const { resolveUserId } = require('../utils/userContext');
const { getPaymentByImpUid, cancelPayment } = require('../services/portoneService');
const { recordAuditLog } = require('../utils/auditLogger');

function formatOrder(orderDoc) {
  if (!orderDoc) return null;

  return {
    id: orderDoc._id.toString(),
    status: orderDoc.status,
    createdAt: orderDoc.createdAt,
    pricing: orderDoc.pricing,
    shipping: orderDoc.shipping,
    payment: orderDoc.payment,
    items: orderDoc.items.map((item) => ({
      id: item._id.toString(),
      product: item.product?.toString?.() ?? null,
      name: item.name,
      sku: item.sku,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
      imagePublicId: item.imagePublicId,
      selectedOptions: item.selectedOptions ?? [],
    })),
  };
}

function resolvePrimaryImage(product) {
  if (!product?.images?.length) return null;
  return product.images.find((image) => image.isPrimary) ?? product.images[0];
}

const listOrders = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(req);
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
  res.json(orders.map(formatOrder));
});

const listAllOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email phone');
  res.json(
    orders.map((order) => ({
      ...formatOrder(order),
      customer: order.user
        ? {
            id: order.user._id?.toString?.() ?? order.user.id ?? '',
            name: order.user.name,
            email: order.user.email,
            phone: order.user.phone,
          }
        : null,
    })),
  );
});

const createOrder = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(req);
  const cart = await Cart.findOne({ user: userId }).populate('items.product');

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: '장바구니가 비어 있습니다.' });
  }

  const {
    shipping = {},
    pricing = {},
    payment = {},
    metadata = {},
  } = req.body ?? {};

  if (!shipping.recipientName || !shipping.phone || !shipping.addressLine1 || !shipping.postalCode) {
    return res.status(400).json({ message: '배송지 정보를 모두 입력해주세요.' });
  }

  const { impUid, merchantUid } = payment ?? {};
  if (!impUid || !merchantUid) {
    return res.status(400).json({ message: '결제 정보가 유효하지 않습니다. (impUid/merchantUid 누락)' });
  }

  const orderItems = cart.items.map((item) => {
    if (!item.product || !item.product._id) {
      throw new Error('상품 정보를 찾을 수 없습니다.');
    }

    const primaryImage = resolvePrimaryImage(item.product);

    return {
      product: item.product._id,
      name: item.product.name,
      sku: item.product.sku,
      price: item.product.price,
      quantity: item.quantity,
      imageUrl: primaryImage?.url ?? '',
      imagePublicId: primaryImage?.publicId ?? '',
      selectedOptions: item.selectedOptions ?? [],
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = Math.max(0, Number.isFinite(Number(pricing.discount)) ? Number(pricing.discount) : 0);
  const shippingFee = Math.max(0, Number.isFinite(Number(pricing.shippingFee)) ? Number(pricing.shippingFee) : 0);
  const total = subtotal - discount + shippingFee;

  const pgPayment = await getPaymentByImpUid(impUid);

  if (pgPayment.merchant_uid !== merchantUid) {
    return res.status(400).json({ message: '결제 정보가 주문 정보와 일치하지 않습니다. (merchant_uid mismatch)' });
  }

  if (!['paid', 'ready'].includes(pgPayment.status)) {
    return res.status(400).json({ message: `결제 상태가 완료되지 않았습니다. (status: ${pgPayment.status})` });
  }

  if (Number(pgPayment.amount) !== Math.max(0, total)) {
    return res.status(400).json({ message: '결제 금액이 주문 금액과 일치하지 않습니다.' });
  }

  const orderStatus = pgPayment.status === 'paid' ? 'paid' : 'pending';

  const existingPayment = await Order.findOne({ 'payment.impUid': impUid });
  if (existingPayment) {
    return res.status(409).json({ message: '이미 처리된 결제입니다.' });
  }

  const existingMerchant = await Order.findOne({ 'payment.merchantUid': merchantUid });
  if (existingMerchant) {
    return res.status(409).json({ message: '이미 처리 중인 주문입니다.' });
  }

  const order = await Order.create({
    user: userId,
    status: orderStatus,
    items: orderItems,
    pricing: {
      subtotal,
      discount: Math.max(0, discount),
      shippingFee: Math.max(0, shippingFee),
      total: Math.max(0, total),
      currency: pricing.currency ?? 'KRW',
    },
    shipping: {
      recipientName: shipping.recipientName,
      phone: shipping.phone,
      addressLine1: shipping.addressLine1,
      addressLine2: shipping.addressLine2 ?? '',
      postalCode: shipping.postalCode,
      requestMessage: shipping.requestMessage ?? '',
    },
    payment: {
      method: payment.method ?? pgPayment.pay_method ?? 'card',
      status: pgPayment.status === 'paid' ? 'paid' : 'pending',
      transactionId: pgPayment.pg_tid ?? '',
      paidAt: pgPayment.paid_at ? new Date(pgPayment.paid_at * 1000) : undefined,
      merchantUid,
      impUid,
      pgProvider: payment.pgProvider ?? pgPayment.pg_provider ?? '',
      cardName: payment.cardName ?? pgPayment.card_name ?? '',
      applyNum: payment.applyNum ?? pgPayment.apply_num ?? '',
    },
    metadata,
    history: [
      {
        status: orderStatus,
        note: orderStatus === 'paid' ? '결제가 완료되었습니다.' : '결제 대기 중입니다.',
      },
    ],
  });

  cart.items = [];
  await cart.save();

  await recordAuditLog({
    action: 'order.create',
    userId,
    ip: req.ip,
    metadata: { orderId: order.id, merchantUid, amount: total },
  });

  res.status(201).json(formatOrder(order));
});

const cancelOrder = asyncHandler(async (req, res) => {
  const requester = req.user ?? {};
  const { orderId } = req.params;
  const { reason } = req.body ?? {};

  let order;
  if (requester.role === 'admin') {
    order = await Order.findById(orderId);
  } else {
    const userId = await resolveUserId(req);
    order = await Order.findOne({ _id: orderId, user: userId });
  }

  if (!order) {
    return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
  }

  if (order.status === 'cancelled') {
    return res.status(400).json({ message: '이미 취소된 주문입니다.' });
  }

  // 결제가 완료된 경우 포트원 결제 취소 API 호출
  if (order.payment.status === 'paid' && order.payment.impUid) {
    try {
      await cancelPayment(order.payment.impUid, reason || '주문 취소');
    } catch (error) {
      return res.status(500).json({
        message: `결제 취소 중 오류가 발생했습니다: ${error.message}`
      });
    }
  }

  order.status = 'cancelled';
  order.payment.status = order.payment.status === 'paid' ? 'refunded' : 'cancelled';
  order.history.push({
    status: 'cancelled',
    note: reason || (requester.role === 'admin' ? '관리자가 주문을 취소했습니다.' : '사용자 요청으로 주문 취소'),
    operator: requester.role === 'admin' ? requester.id ?? requester._id : undefined,
  });
  await order.save();

  const actorId = requester?.id ?? requester?._id ?? null;
  await recordAuditLog({
    action: 'order.cancel',
    userId: actorId,
    ip: req.ip,
    metadata: { orderId, role: requester.role, reason },
  });

  res.status(204).send();
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const requester = req.user ?? {};
  if (requester.role !== 'admin') {
    return res.status(403).json({ message: '접근 권한이 없습니다.' });
  }

  const { orderId } = req.params;
  const { status, shipping } = req.body ?? {};

  const allowedStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: '지원하지 않는 주문 상태입니다.' });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
  }

  order.status = status;
  if (shipping) {
    order.shipping = {
      ...order.shipping.toObject?.(),
      ...shipping,
    };
  }

  if (status === 'shipped' && !order.shipping.shippedAt) {
    order.shipping.shippedAt = new Date();
  }
  if (status === 'delivered' && !order.shipping.deliveredAt) {
    order.shipping.deliveredAt = new Date();
  }

  order.history.push({
    status,
    note: '관리자가 주문 상태를 변경했습니다.',
    operator: requester.id ?? requester._id,
  });

  await order.save();

  res.json(formatOrder(order));
});

module.exports = {
  listOrders,
  listAllOrders,
  createOrder,
  cancelOrder,
  updateOrderStatus,
};
