const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const CSRF_COOKIE_NAME = 'csrfToken';
const CSRF_HEADER_NAME = 'x-csrf-token';

// Path/method별 CSRF 예외 규칙
const EXCLUDED_RULES = [
  { prefix: '/api/auth/login', methods: ['POST'] },
  { prefix: '/api/auth/logout', methods: ['POST'] },
  { prefix: '/api/auth/csrf-token', methods: ['GET'] },
  { prefix: '/api/payments/webhook', methods: ['POST'] },
  // 회원가입만 예외, 수정/삭제는 보호
  { prefix: '/api/users', methods: ['POST'] },
];

function isExcluded(req) {
  return EXCLUDED_RULES.some(
    (rule) =>
      req.path.startsWith(rule.prefix) &&
      (!rule.methods || rule.methods.includes(req.method))
  );
}

function csrfProtection(req, res, next) {
  if (SAFE_METHODS.includes(req.method) || isExcluded(req)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res
      .status(403)
      .json({ message: 'CSRF 토큰이 없거나 일치하지 않습니다.' });
  }

  return next();
}

module.exports = {
  csrfProtection,
  CSRF_COOKIE_NAME,
};
