const axios = require('axios');

const PORTONE_API_BASE = 'https://api.iamport.kr';

async function getAccessToken() {
  const key = process.env.PORTONE_IMP_KEY;
  const secret = process.env.PORTONE_IMP_SECRET;

  if (!key || !secret) {
    throw new Error('포트원 API 키가 설정되어 있지 않습니다. PORTONE_IMP_KEY/PORTONE_IMP_SECRET를 확인해주세요.');
  }

  const response = await axios.post(`${PORTONE_API_BASE}/users/getToken`, {
    imp_key: key,
    imp_secret: secret,
  });

  if (response.data.code !== 0) {
    throw new Error(`포트원 토큰 발급 실패: ${response.data.message}`);
  }

  return response.data.response.access_token;
}

async function getPaymentByImpUid(impUid) {
  const accessToken = await getAccessToken();

  // 2026.1.26 포트원 API 변경 대응: 테스트 환경에서는 include_sandbox=true 필요
  const isTestMode = process.env.NODE_ENV !== 'production';
  const params = isTestMode ? { include_sandbox: true } : {};

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

  // amount가 지정되면 부분 취소, 없으면 전액 취소
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
