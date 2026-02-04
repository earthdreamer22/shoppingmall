const { Schema, model } = require('mongoose');

const selectedOptionSchema = new Schema(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    imageUrl: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    selectedOptions: { type: [selectedOptionSchema], default: [] },
  },
  {
    _id: true,
    toJSON: {
      transform: (_, ret) => {
        const { _id, ...rest } = ret;
        return { id: _id.toString(), ...rest };
      },
    },
  },
);

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: '주문 상품이 최소 1개 이상이어야 합니다.',
      },
    },
    pricing: {
      subtotal: { type: Number, required: true, min: 0 },
      discount: { type: Number, required: true, min: 0, default: 0 },
      shippingFee: { type: Number, required: true, min: 0, default: 0 },
      total: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'KRW' },
    },
    shipping: {
      recipientName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: '' },
      postalCode: { type: String, required: true },
      requestMessage: { type: String, default: '' },
      carrier: { type: String, default: '' },
      trackingNumber: { type: String, default: '' },
      shippedAt: { type: Date },
      deliveredAt: { type: Date },
    },
    payment: {
      method: { type: String, default: 'pending' },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
        default: 'pending',
      },
      transactionId: { type: String, default: '' },
      paidAt: { type: Date },
      paymentId: { type: String, default: '' }, // PortOne V2 결제 식별자 또는 계좌이체 주문 ID
      merchantUid: { type: String, default: '' },
      impUid: { type: String, default: undefined }, // v1 전용. v2는 paymentId/txId를 사용하므로 비워둔다.
      pgProvider: { type: String, default: '' },
      cardName: { type: String, default: '' },
      applyNum: { type: String, default: '' },
    },
    history: [
      {
        status: String,
        note: { type: String, default: '' },
        occurredAt: { type: Date, default: Date.now },
        operator: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    metadata: {
      couponCode: { type: String, default: '' },
      cartSnapshotId: { type: Schema.Types.ObjectId },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        const { _id, __v, ...rest } = ret;
        return { id: _id.toString(), ...rest };
      },
    },
  },
);

// impUid는 포트원 v1에서만 사용. 빈 문자열은 인덱싱하지 않도록 partial 필터로 중복 오류를 방지한다.
orderSchema.index(
  { 'payment.impUid': 1 },
  {
    unique: true,
    partialFilterExpression: { 'payment.impUid': { $exists: true, $ne: '' } },
  },
);

module.exports = model('Order', orderSchema);
