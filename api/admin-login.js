const {
  getAdminPassword,
  safeEqual,
  createSessionToken,
  buildSessionCookie,
} = require('./_admin-auth');

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;

  try {
    return JSON.parse(req.body);
  } catch {
    return {};
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const adminPassword = getAdminPassword();
    if (!adminPassword) {
      res.status(500).json({ error: 'ADMIN_PASSWORD não configurada no ambiente.' });
      return;
    }

    const body = parseBody(req);
    const password = String(body.password || '');

    if (!safeEqual(password, adminPassword)) {
      res.status(401).json({ error: 'Senha inválida.' });
      return;
    }

    const token = createSessionToken();
    res.setHeader('Set-Cookie', buildSessionCookie(token));
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('admin-login error:', error);
    res.status(500).json({ error: 'Erro interno no login.' });
  }
};
