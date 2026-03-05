const {
  getSpeedPagConfig,
  parseJsonBody,
  pickPixCode,
} = require('./_speedpag');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const body = parseJsonBody(req);
    const amount = Number(body.amount || 0);
    const customer = body.customer || {};
    const shipping = body.shipping || {};

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: 'Valor inválido para cobrança PIX.' });
      return;
    }

    const { apiUrl, authHeader } = getSpeedPagConfig();

    const externalRef = `mesa-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const payload = {
      amount,
      paymentMethod: 'pix',
      externalRef,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        document: customer.document,
        address: {
          street: shipping.street,
          streetNumber: shipping.number,
          complement: shipping.complement,
          neighborhood: shipping.neighborhood,
          city: shipping.city,
          state: shipping.state,
          zipCode: shipping.zipCode,
          country: 'BR',
        },
      },
      items: [
        {
          title: 'Mesa Dobrável Tipo Maleta 180x60cm',
          quantity: 1,
          tangible: true,
          unitPrice: amount,
          externalRef: 'mesa-dobravel-180x60',
        },
      ],
      shipping: {
        fee: 0,
        address: {
          street: shipping.street,
          streetNumber: shipping.number,
          complement: shipping.complement,
          neighborhood: shipping.neighborhood,
          city: shipping.city,
          state: shipping.state,
          zipCode: shipping.zipCode,
          country: 'BR',
        },
      },
      metadata: JSON.stringify({
        color: body.color,
        source: 'vercel-web',
      }),
    };

    const speedPagResponse = await fetch(`${apiUrl}/transactions`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseJson = await speedPagResponse.json();

    if (!speedPagResponse.ok) {
      res.status(400).json({
        success: false,
        error: responseJson?.message || responseJson?.error || 'Erro ao criar cobrança PIX na SpeedPag.',
      });
      return;
    }

    const transaction = responseJson?.data || responseJson;
    const transactionId = transaction?.id;
    const pixCode = pickPixCode(transaction);

    if (!transactionId || !pixCode) {
      res.status(500).json({
        success: false,
        error: 'Resposta da SpeedPag sem id ou código PIX.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        externalRef: String(transactionId),
        external_ref: String(transactionId),
        transactionId,
        paymentData: {
          copyPaste: pixCode,
          qrCode: pixCode,
          expirationDate: transaction?.pix?.expirationDate || null,
        },
        pixCode,
      },
    });
  } catch (error) {
    console.error('create-pix-payment error:', error);
    res.status(500).json({ success: false, error: error.message || 'Erro interno ao criar PIX.' });
  }
};
