const { buildClearSessionCookie } = require('./_admin-auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.setHeader('Set-Cookie', buildClearSessionCookie());
  res.status(200).json({ success: true });
};
