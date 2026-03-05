const { isAuthenticatedRequest } = require('./_admin-auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.status(200).json({ authenticated: isAuthenticatedRequest(req) });
};
