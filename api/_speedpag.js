function buildBasicAuth(publicKey, secretKey) {
  const token = Buffer.from(`${publicKey}:${secretKey}`).toString('base64');
  return `Basic ${token}`;
}

function parseJsonBody(req) {
  if (!req.body) return {};

  if (typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return {};
}

function pickPixCode(transaction) {
  return (
    transaction?.pix?.qrcode ||
    transaction?.pix?.copyPaste ||
    transaction?.pix?.payload ||
    transaction?.qrcode ||
    transaction?.qrCode ||
    ''
  );
}

function mapStatusToFrontend(status) {
  const paidStatuses = ['approved', 'paid'];
  if (paidStatuses.includes(status)) return 'paid';
  return status || 'pending';
}

function getSpeedPagConfig() {
  const publicKey = process.env.SPEEDPAG_PUBLIC_KEY;
  const secretKey = process.env.SPEEDPAG_SECRET_KEY;

  if (!publicKey || !secretKey) {
    throw new Error('SPEEDPAG_PUBLIC_KEY e SPEEDPAG_SECRET_KEY não configuradas.');
  }

  return {
    apiUrl: 'https://api.speedpag.com/v1',
    authHeader: buildBasicAuth(publicKey, secretKey),
  };
}

module.exports = {
  getSpeedPagConfig,
  parseJsonBody,
  pickPixCode,
  mapStatusToFrontend,
};
