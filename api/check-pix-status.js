const {
  getSpeedPagConfig,
  parseJsonBody,
  mapStatusToFrontend,
} = require('./_speedpag');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ status: 'error', error: 'Method not allowed' });
    return;
  }

  try {
    const body = parseJsonBody(req);
    const transactionId = Number(body.externalRef || body.transactionId);

    if (!transactionId) {
      res.status(400).json({ status: 'pending', error: 'externalRef/transactionId inválido.' });
      return;
    }

    const { apiUrl, authHeader } = getSpeedPagConfig();

    const speedPagResponse = await fetch(`${apiUrl}/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });

    const responseJson = await speedPagResponse.json();

    if (!speedPagResponse.ok) {
      res.status(200).json({ status: 'pending' });
      return;
    }

    const transaction = responseJson?.data || responseJson;
    const normalizedStatus = mapStatusToFrontend(transaction?.status);

    res.status(200).json({
      status: normalizedStatus,
      amount: transaction?.amount || 0,
      gatewayStatus: transaction?.status || null,
      transactionId: transaction?.id || transactionId,
    });
  } catch (error) {
    console.error('check-pix-status error:', error);
    res.status(200).json({ status: 'pending' });
  }
};
