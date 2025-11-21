const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const CSRF_COOKIE_NAME = 'csrfToken';
const CSRF_HEADER_NAME = 'x-csrf-token';

const EXCLUDED_PATHS = ['/api/auth/login', '/api/users', '/api/payments/webhook'];

function isExcludedPath(path) {
  return EXCLUDED_PATHS.some((excluded) => path.startsWith(excluded));
}

function csrfProtection(req, res, next) {
  if (SAFE_METHODS.includes(req.method) || isExcludedPath(req.path)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: '유효하지 않은 CSRF 토큰입니다.' });
  }

  return next();
}

module.exports = {
  csrfProtection,
  CSRF_COOKIE_NAME,
};
