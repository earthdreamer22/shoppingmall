const Product = require('../models/Product');
const { asyncHandler } = require('../utils/asyncHandler');
const cloudinary = require('../config/cloudinary');

function normalizeImages(images = [], primaryImagePublicId) {
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error('최소 한 장 이상의 상품 이미지를 등록해야 합니다.');
  }

  const enriched = images.map((image) => ({
    publicId: String(image.publicId),
    url: String(image.url),
    isPrimary: Boolean(image.isPrimary),
  }));

  if (primaryImagePublicId) {
    const matched = enriched.some((image) => image.publicId === primaryImagePublicId);
    if (!matched) {
      throw new Error('대표 이미지가 이미지 목록과 일치하지 않습니다.');
    }
    return enriched.map((image) => ({
      ...image,
      isPrimary: image.publicId === primaryImagePublicId,
    }));
  }

  let hasPrimary = enriched.some((image) => image.isPrimary);
  if (!hasPrimary) {
    enriched[0].isPrimary = true;
    hasPrimary = true;
  }

  if (enriched.filter((image) => image.isPrimary).length > 1) {
    throw new Error('대표 이미지는 하나만 선택할 수 있습니다.');
  }

  return enriched;
}

async function destroyImages(publicIds = []) {
  if (!cloudinary.isConfigured || !publicIds.length) return;

  await Promise.all(
    publicIds.map(async (publicId) => {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('[cloudinary] Failed to destroy image', publicId, error.message);
      }
    }),
  );
}

const listProducts = asyncHandler(async (req, res) => {
  const { category, limit = 20 } = req.query ?? {};
  const filter = {};

  if (category) {
    const normalized = String(category).trim().toLowerCase();
    if (!Product.CATEGORIES.includes(normalized)) {
      return res.status(400).json({ message: '지원하지 않는 상품 카테고리입니다.' });
    }
    filter.category = normalized;
  }

  // 페이지네이션 제한: 최대 100개
  const maxLimit = 100;
  const numericLimit = Math.min(Math.max(1, Number(limit) || 20), maxLimit);

  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .limit(numericLimit);

  res.json(products);
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) {
    return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
  }
  res.json(product);
});

const createProduct = asyncHandler(async (req, res) => {
  const { sku, name, price, category, shippingFee = 3000, description = '', detailBlocks = [], options = [], images, primaryImagePublicId } = req.body;

  if (!sku) {
    return res.status(400).json({ message: '상품 ID(sku)는 필수입니다.' });
  }

  if (!name) {
    return res.status(400).json({ message: '상품 이름을 입력해주세요.' });
  }

  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ message: '가격은 0 이상의 숫자여야 합니다.' });
  }

  if (!category) {
    return res.status(400).json({ message: '상품 카테고리를 선택해주세요.' });
  }

  const numericShippingFee = Number(shippingFee);
  if (Number.isNaN(numericShippingFee) || numericShippingFee < 0 || numericShippingFee % 500 !== 0) {
    return res.status(400).json({ message: '배송비는 500원 단위의 0 이상 값이어야 합니다.' });
  }

  const normalizedImages = normalizeImages(images, primaryImagePublicId);

  try {
    const product = await Product.create({
      sku: sku.trim(),
      name: name.trim(),
      price: numericPrice,
      category,
      shippingFee: numericShippingFee,
      description,
      detailBlocks,
      options,
      images: normalizedImages,
    });

    res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.sku) {
      return res.status(409).json({ message: '이미 사용 중인 상품 ID(sku)입니다.' });
    }
    throw error;
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const {
    sku,
    name,
    price,
    category,
    shippingFee,
    description,
    detailBlocks,
    options,
    images,
    primaryImagePublicId,
    removedImagePublicIds = [],
  } = req.body;

  const updates = {};

  if (sku !== undefined) {
    updates.sku = String(sku).trim();
  }

  if (name !== undefined) {
    updates.name = String(name).trim();
  }

  if (price !== undefined) {
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ message: '가격은 0 이상의 숫자여야 합니다.' });
    }
    updates.price = numericPrice;
  }

  if (category !== undefined) {
    updates.category = category;
  }

  if (shippingFee !== undefined) {
    const numericShippingFee = Number(shippingFee);
    if (Number.isNaN(numericShippingFee) || numericShippingFee < 0 || numericShippingFee % 500 !== 0) {
      return res.status(400).json({ message: '배송비는 500원 단위의 0 이상 값이어야 합니다.' });
    }
    updates.shippingFee = numericShippingFee;
  }

  if (description !== undefined) {
    updates.description = description;
  }

  if (detailBlocks !== undefined) {
    updates.detailBlocks = detailBlocks;
  }

  if (options !== undefined) {
    updates.options = options;
  }

  if (images !== undefined) {
    updates.images = normalizeImages(images, primaryImagePublicId);
  }

  try {
    const product = await Product.findByIdAndUpdate(productId, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    await destroyImages(removedImagePublicIds);

    res.json(product);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.sku) {
      return res.status(409).json({ message: '이미 사용 중인 상품 ID(sku)입니다.' });
    }
    throw error;
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.productId);
  if (!product) {
    return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
  }

  const publicIds = (product.images ?? []).map((image) => image.publicId);
  await destroyImages(publicIds);

  res.status(204).send();
});

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
