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

  const response = await axios.get(`${PORTONE_API_BASE}/payments/${impUid}`, {
    headers: {
      Authorization: accessToken,
    },
  });

  if (response.data.code !== 0) {
    throw new Error(`포트원 결제 조회 실패: ${response.data.message}`);
  }

  return response.data.response;
}

module.exports = {
  getAccessToken,
  getPaymentByImpUid,
};
