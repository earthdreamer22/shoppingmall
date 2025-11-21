const express = require('express');
const { handleWebhook } = require('../controllers/paymentController');

const router = express.Router();

router.post('/webhook', handleWebhook);

module.exports = router;
