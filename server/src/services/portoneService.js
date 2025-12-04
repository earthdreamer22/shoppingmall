const axios = require('axios');
const { config } = require('../config/env');

const PORTONE_API_BASE = 'https://api.iamport.kr';

async function getAccessToken() {
  const { impKey, impSecret } = config.portone;

  const response = await axios.post(`${PORTONE_API_BASE}/users/getToken`, {
    imp_key: impKey,
    imp_secret: impSecret,
  });

  if (response.data.code !== 0) {
    throw new Error(`포트원 액세스 토큰 발급 실패: ${response.data.message}`);
  }

  return response.data.response.access_token;
}

async function getPaymentByImpUid(impUid) {
  const accessToken = await getAccessToken();

  // include_sandbox는 테스트 모드에서만 사용
  const params = config.portone.isTestMode ? { include_sandbox: true } : {};

  const response = await axios.get(`${PORTONE_API_BASE}/payments/${impUid}`, {
    headers: {
      Authorization: accessToken,
    },
    params,
  });

  if (response.data.code !== 0) {
    throw new Error(`포트원 결제 조회 실패: ${response.data.message}`);
  }

  return response.data.response;
}

async function cancelPayment(impUid, reason, amount = null) {
  const accessToken = await getAccessToken();

  const requestBody = {
    imp_uid: impUid,
    reason: reason || '관리자 주문 취소',
  };

  if (amount) {
    requestBody.amount = amount;
  }

  const response = await axios.post(`${PORTONE_API_BASE}/payments/cancel`, requestBody, {
    headers: {
      Authorization: accessToken,
    },
  });

  if (response.data.code !== 0) {
    throw new Error(`포트원 결제 취소 실패: ${response.data.message}`);
  }

  return response.data.response;
}

module.exports = {
  getAccessToken,
  getPaymentByImpUid,
  cancelPayment,
};
