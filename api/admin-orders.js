const { getSpeedPagConfig } = require('./_speedpag');
const { isAuthenticatedRequest } = require('./_admin-auth');

function normalizeTransaction(raw) {
  const transaction = raw?.data && !raw.id ? raw.data : raw;
  const customer = transaction?.customer || {};

  return {
    id: transaction?.id ?? null,
    externalRef: transaction?.externalRef ?? null,
    amount: Number(transaction?.amount || 0),
    paymentMethod: transaction?.paymentMethod || null,
    status: transaction?.status || 'unknown',
    customerName: customer?.name || null,
    customerEmail: customer?.email || null,
    createdAt: transaction?.createdAt || null,
    paidAt: transaction?.paidAt || null,
  };
}

function isPaid(status) {
  return status === 'paid' || status === 'approved';
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!isAuthenticatedRequest(req)) {
    res.status(401).json({ error: 'Não autorizado.' });
    return;
  }

  try {
    const { apiUrl, authHeader } = getSpeedPagConfig();

    const page = req.query.page || '1';
    const limit = req.query.limit || '100';

    const url = `${apiUrl}/transactions?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`;

    const speedPagResponse = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });

    const responseJson = await speedPagResponse.json();

    if (!speedPagResponse.ok) {
      res.status(400).json({
        error: responseJson?.message || responseJson?.error || 'Falha ao listar transações na SpeedPag.',
      });
      return;
    }

    const list = Array.isArray(responseJson)
      ? responseJson
      : Array.isArray(responseJson?.data)
        ? responseJson.data
        : Array.isArray(responseJson?.items)
          ? responseJson.items
          : [];

    const orders = list.map(normalizeTransaction);

    const generatedCount = orders.length;
    const paidCount = orders.filter((order) => isPaid(order.status)).length;

    res.status(200).json({
      summary: {
        generatedCount,
        paidCount,
        pendingCount: Math.max(generatedCount - paidCount, 0),
      },
      orders,
    });
  } catch (error) {
    console.error('admin-orders error:', error);
    res.status(500).json({ error: error.message || 'Erro interno ao listar pedidos.' });
  }
};
