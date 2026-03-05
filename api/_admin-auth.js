const crypto = require('crypto');

const SESSION_COOKIE = 'admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const index = part.indexOf('=');
      if (index === -1) return acc;
      const key = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || '';
}

function getSigningSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
}

function safeEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));

  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function createSessionToken() {
  const secret = getSigningSecret();
  if (!secret) {
    throw new Error('ADMIN_PASSWORD/ADMIN_SESSION_SECRET não configurado.');
  }

  const exp = Date.now() + SESSION_TTL_SECONDS * 1000;
  const nonce = crypto.randomBytes(8).toString('hex');
  const payload = `${exp}.${nonce}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return Buffer.from(`${payload}.${signature}`, 'utf8').toString('base64url');
}

function verifySessionToken(token) {
  try {
    if (!token) return false;

    const secret = getSigningSecret();
    if (!secret) return false;

    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [exp, nonce, signature] = decoded.split('.');

    if (!exp || !nonce || !signature) return false;

    const payload = `${exp}.${nonce}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (!safeEqual(signature, expected)) return false;
    if (Number(exp) < Date.now()) return false;

    return true;
  } catch {
    return false;
  }
}

function buildSessionCookie(token) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}; Secure`;
}

function buildClearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`;
}

function isAuthenticatedRequest(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return verifySessionToken(cookies[SESSION_COOKIE]);
}

module.exports = {
  getAdminPassword,
  safeEqual,
  createSessionToken,
  buildSessionCookie,
  buildClearSessionCookie,
  isAuthenticatedRequest,
};
