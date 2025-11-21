const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const InvalidToken = require('../models/InvalidToken');
const { asyncHandler } = require('../utils/asyncHandler');
const { extractToken } = require('../middleware/authMiddleware');
const { generateCsrfToken } = require('../utils/csrf');
const { CSRF_COOKIE_NAME } = require('../middleware/csrfMiddleware');
const { recordAuditLog } = require('../utils/auditLogger');

const TOKEN_EXPIRES_MINUTES = Number(process.env.JWT_EXPIRES_MINUTES ?? 60);
const COOKIE_NAME = 'accessToken';

function buildBaseCookieOptions() {
  const maxAge = TOKEN_EXPIRES_MINUTES * 60 * 1000;
  const cookieSameSite = process.env.COOKIE_SAMESITE ?? 'strict';
  const cookieSecure =
    process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';

  return {
    sameSite: cookieSameSite,
    secure: cookieSecure,
    maxAge,
  };
}

function buildAuthCookieOptions() {
  return {
    ...buildBaseCookieOptions(),
    httpOnly: true,
  };
}

function buildCsrfCookieOptions() {
  return {
    ...buildBaseCookieOptions(),
    httpOnly: false,
  };
}

function attachCsrfToken(res) {
  const token = generateCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, token, buildCsrfCookieOptions());
  return token;
}

function issueToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET 환경 변수가 설정되어 있지 않습니다.');
  }

  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, secret, { expiresIn: `${TOKEN_EXPIRES_MINUTES}m` });
}

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 모두 입력해주세요.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    await recordAuditLog({ action: 'auth.login_failed', ip: req.ip, metadata: { email: normalizedEmail } });
    return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  const isValidPassword = await bcrypt.compare(String(password), user.password);
  if (!isValidPassword) {
    await recordAuditLog({ action: 'auth.login_failed', ip: req.ip, metadata: { email: normalizedEmail } });
    return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  const token = issueToken(user);
  const cookieOptions = buildAuthCookieOptions();
  res.cookie(COOKIE_NAME, token, cookieOptions);
  const csrfToken = attachCsrfToken(res);
  await recordAuditLog({ action: 'auth.login', userId: user.id, ip: req.ip });

  res.json({ user: user.toJSON(), csrfToken });
});

const logout = asyncHandler(async (req, res) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(204).send();
  }

  try {
    const payload = jwt.decode(token);
    if (payload?.exp) {
      const expiresAt = new Date(payload.exp * 1000);
      await InvalidToken.findOneAndUpdate(
        { token },
        { token, expiresAt },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
  } catch (error) {
    console.error('[auth] Failed to record invalid token', error.message);
  }

  const cookieOptions = buildAuthCookieOptions();
  delete cookieOptions.maxAge;
  res.clearCookie(COOKIE_NAME, cookieOptions);
  const csrfCookieOptions = buildCsrfCookieOptions();
  delete csrfCookieOptions.maxAge;
  res.clearCookie(CSRF_COOKIE_NAME, csrfCookieOptions);
  await recordAuditLog({ action: 'auth.logout', userId: req.user?.id, ip: req.ip });
  res.status(204).send();
});

const me = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: '인증 정보가 필요합니다.' });
  }

  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
  }

  res.json({ user: user.toJSON() });
});

const issueCsrfToken = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: '인증 정보가 필요합니다.' });
  }

  const csrfToken = attachCsrfToken(res);
  res.json({ csrfToken });
});

module.exports = {
  login,
  logout,
  me,
  issueCsrfToken,
};
