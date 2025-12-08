const { Schema, model } = require('mongoose');

const imageSchema = new Schema(
  {
    publicId: { type: String, required: true },
    url: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false },
);

const detailBlockSchema = new Schema(
  {
    type: { type: String, enum: ['text', 'image', 'notice'], required: true },
    content: { type: String, default: '' },
    url: { type: String },
    publicId: { type: String },
  },
  { _id: false },
);

const optionSchema = new Schema(
  {
    name: { type: String, required: true },
    values: [{ type: String }],
    required: { type: Boolean, default: false },
  },
  { _id: false },
);

const CATEGORIES = ['book_repair', 'class', 'shop'];

const productSchema = new Schema(
  {
    sku: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, enum: CATEGORIES },
    shippingFee: { type: Number, default: 3000, min: 0 },
    description: { type: String, default: '' },
    detailBlocks: { type: [detailBlockSchema], default: [] },
    options: { type: [optionSchema], default: [] },
    images: {
      type: [imageSchema],
      validate: {
        validator: (images) => Array.isArray(images) && images.length > 0,
        message: '최소 한 장 이상의 이미지를 등록해야 합니다.',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        const { _id, __v, ...rest } = ret;
        const primaryImage = rest.images?.find((image) => image.isPrimary) ?? rest.images?.[0] ?? null;
        return { id: _id.toString(), ...rest, primaryImage };
      },
    },
  },
);

productSchema.index({ sku: 1 }, { unique: true });

productSchema.statics.CATEGORIES = CATEGORIES;

module.exports = model('Product', productSchema);
