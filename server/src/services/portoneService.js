const axios = require('axios');
const { config } = require('../config/env');

const PORTONE_API_BASE = 'https://api.portone.io';

async function getPaymentByPaymentId(paymentId) {
  const { storeId, apiSecret } = config.portone;

  const response = await axios.get(`${PORTONE_API_BASE}/payments/${paymentId}`, {
    headers: {
      Authorization: `PortOne ${apiSecret}`,
    },
  });

  if (response.status !== 200) {
    throw new Error(`포트원 결제 조회 실패: ${response.data?.message || '알 수 없는 오류'}`);
  }

  return response.data;
}

async function cancelPayment(paymentId, reason, amount = null) {
  const { storeId, apiSecret } = config.portone;

  const requestBody = {
    storeId,
    reason: reason || '사용자 주문 취소',
  };

  if (amount) {
    requestBody.amount = amount;
  }

  const response = await axios.post(
    `${PORTONE_API_BASE}/payments/${paymentId}/cancel`,
    requestBody,
    {
      headers: {
        Authorization: `PortOne ${apiSecret}`,
      },
    },
  );

  if (response.status !== 200) {
    throw new Error(`포트원 결제 취소 실패: ${response.data?.message || '알 수 없는 오류'}`);
  }

  return response.data;
}

module.exports = {
  getPaymentByPaymentId,
  cancelPayment,
};
