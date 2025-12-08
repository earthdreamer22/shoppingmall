const { z } = require('../middleware/validate');

const selectedOptionSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
});

const orderItemSchema = z.object({
  product: z.string().min(1),
  sku: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  selectedOptions: z.array(selectedOptionSchema).optional().default([]),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  pricing: z.object({
    subtotal: z.number().nonnegative(),
    discount: z.number().nonnegative().optional().default(0),
    shippingFee: z.number().nonnegative(),
    total: z.number().nonnegative(),
    currency: z.string().optional(),
  }),
  shipping: z.object({
    recipientName: z.string().min(1),
    phone: z.string().min(1),
    postalCode: z.string().min(1),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional().default(''),
    requestMessage: z.string().optional().default(''),
  }),
  payment: z.object({
    method: z.string().min(1),
    impUid: z.string().optional(),
    merchantUid: z.string().optional(),
    pgProvider: z.string().optional(),
    payMethod: z.string().optional(),
    pgTid: z.string().optional(),
    cardName: z.string().optional(),
    applyNum: z.string().optional(),
  }),
  metadata: z.record(z.any()).optional(),
});

module.exports = {
  createOrderSchema,
};
