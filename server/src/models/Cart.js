const { Schema, model } = require('mongoose');

const cartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1, min: 1 },
  },
  {
    _id: true,
    toJSON: {
      transform: (_, ret) => {
        const { _id, product, ...rest } = ret;
        return {
          id: _id.toString(),
          product: product instanceof Object ? product : undefined,
          productId: product && product.toString ? product.toString() : product,
          ...rest,
        };
      },
    },
  },
);

const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
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

module.exports = model('Cart', cartSchema);
