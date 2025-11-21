const { Schema, model } = require('mongoose');

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    imageUrl: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
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
      merchantUid: { type: String, default: '' },
      impUid: { type: String, default: '' },
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

orderSchema.index({ 'payment.impUid': 1 }, { unique: true, sparse: true });

module.exports = model('Order', orderSchema);
