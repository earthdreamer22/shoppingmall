const express = require('express');
const { getCart, addToCart, updateCartItem, removeFromCart } = require('../controllers/cartController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/objectIdValidator');

const router = express.Router();

router.get('/', authenticate, getCart);
router.post('/', authenticate, addToCart);
router.put('/:itemId', authenticate, validateObjectId('itemId'), updateCartItem);
router.delete('/:itemId', authenticate, validateObjectId('itemId'), removeFromCart);

module.exports = router;
