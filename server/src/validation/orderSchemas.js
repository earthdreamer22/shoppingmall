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
  // 주문 생성은 서버에서 장바구니 기준으로 아이템을 읽으므로, 클라이언트 요청에 items가 없어도 통과시키기 위해 optional 처리
  items: z.array(orderItemSchema).optional().default([]),
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
    paymentId: z.string().min(1), // PortOne v2 paymentId (프론트에서 생성한 주문/결제 식별자)
    txId: z.string().optional(), // PG 거래 ID (PortOne v2 txId)
    transactionType: z.string().optional(),
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
