const { z } = require('../middleware/validate');

const orderItemSchema = z.object({
  product: z.string().min(1),
  sku: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  selectedOptions: z.array(z.string()).optional().default([]),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  pricing: z.object({
    subtotal: z.number().nonnegative(),
    shipping: z.number().nonnegative(),
    total: z.number().nonnegative(),
  }),
  shipping: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    phone: z.string().min(1),
    memo: z.string().optional().default(''),
  }),
  payment: z.object({
    method: z.string().min(1),
  }),
});

module.exports = {
  createOrderSchema,
};
