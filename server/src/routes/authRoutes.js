const express = require('express');
const { login, logout, me, issueCsrfToken } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/authRateLimiter');

const router = express.Router();

router.post('/login', loginLimiter, login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.get('/csrf-token', authenticate, issueCsrfToken);

module.exports = router;
