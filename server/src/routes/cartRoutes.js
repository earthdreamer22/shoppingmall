const express = require('express');
const { getCart, addToCart, removeFromCart } = require('../controllers/cartController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, getCart);
router.post('/', authenticate, addToCart);
router.delete('/:itemId', authenticate, removeFromCart);

module.exports = router;
