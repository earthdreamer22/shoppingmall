const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../utils/asyncHandler');
const InvalidToken = require('../models/InvalidToken');

function extractToken(req) {
  const authHeader = req.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
}

const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: '인증 정보가 필요합니다.' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[auth] Missing JWT_SECRET environment variable');
    return res.status(500).json({ message: '서버 인증 구성이 올바르지 않습니다.' });
  }

  const invalidToken = await InvalidToken.findOne({ token }).lean();
  if (invalidToken) {
    return res.status(401).json({ message: '만료된 인증 토큰입니다.' });
  }

  try {
    const payload = jwt.verify(token, secret);
    req.authToken = token;
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
    next();
  } catch (error) {
    console.error('[auth] Token verification failed', error.message);
    return res.status(401).json({ message: '유효하지 않은 인증 토큰입니다.' });
  }
});

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '인증 정보가 필요합니다.' });
    }

    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: '접근 권한이 없습니다.' });
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorize,
  extractToken,
};
