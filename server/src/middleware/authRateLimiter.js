const rateLimit = require('express-rate-limit');

// 로그인 시도 제한: 15분당 5회
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5회 시도
  message: '너무 많은 로그인 시도가 있었습니다. 15분 후에 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  // IP 주소 기반 제한
  keyGenerator: (req) => {
    return req.ip;
  },
});

// 회원가입 제한: 1시간당 3회
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 3, // 최대 3회 시도
  message: '너무 많은 회원가입 시도가 있었습니다. 1시간 후에 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip;
  },
});

module.exports = {
  loginLimiter,
  registerLimiter,
};
