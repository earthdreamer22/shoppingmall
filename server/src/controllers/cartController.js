const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { asyncHandler } = require('../utils/asyncHandler');
const { resolveUserId } = require('../utils/userContext');

function resolvePrimaryImage(product) {
  if (!product?.images?.length) return null;
  return product.images.find((image) => image.isPrimary) ?? product.images[0];
}

function formatCart(cartDoc) {
  if (!cartDoc) {
    return { id: null, items: [] };
  }

  const items = cartDoc.items.map((item) => {
    const product = item.product && item.product._id ? item.product : null;
    const primaryImage = resolvePrimaryImage(product);
    return {
      id: item._id.toString(),
      productId: product ? product._id.toString() : item.product?.toString?.(),
      name: product ? product.name : '삭제된 상품',
      price: product ? product.price : 0,
      shippingFee: product ? product.shippingFee ?? 0 : 0,
      quantity: item.quantity,
      imageUrl: primaryImage?.url ?? '',
      primaryImage,
      description: product ? product.description : '',
      selectedOptions: item.selectedOptions ?? [],
    };
  });

  return { id: cartDoc._id.toString(), items };
}

const getCart = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(req);
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) {
    return res.json({ id: null, items: [] });
  }

  res.json(formatCart(cart));
});

const addToCart = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(req);
  const { productId, quantity = 1, selectedOptions = [] } = req.body;

  if (!productId) {
    return res.status(400).json({ message: 'productId가 필요합니다.' });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
  }

  const numericQuantity = Number(quantity) || 1;
  if (numericQuantity <= 0) {
    return res.status(400).json({ message: '수량은 1 이상이어야 합니다.' });
  }

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  // 동일 상품 + 동일 옵션 조합인지 확인
  const optionsKey = JSON.stringify(selectedOptions.sort((a, b) => a.name.localeCompare(b.name)));
  const existingItem = cart.items.find((item) => {
    if (item.product.toString() !== productId) return false;
    const itemOptionsKey = JSON.stringify((item.selectedOptions || []).sort((a, b) => a.name.localeCompare(b.name)));
    return itemOptionsKey === optionsKey;
  });

  if (existingItem) {
    existingItem.quantity += numericQuantity;
  } else {
    cart.items.push({ product: productId, quantity: numericQuantity, selectedOptions });
  }

  await cart.save();
  await cart.populate('items.product');

  res.status(201).json(formatCart(cart));
});

const removeFromCart = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(req);
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return res.status(404).json({ message: '장바구니가 비어 있습니다.' });
  }

  const exists = cart.items.id(itemId);
  if (!exists) {
    return res.status(404).json({ message: '해당 상품이 장바구니에 없습니다.' });
  }

  cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
  await cart.save();
  await cart.populate('items.product');

  res.json(formatCart(cart));
});

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
};
