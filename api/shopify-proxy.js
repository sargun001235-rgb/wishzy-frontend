export default async function handler(req, res) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const rawDomain = process.env.SHOPIFY_STORE_DOMAIN || '';
    const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

    if (!domain || !clientId || !clientSecret) {
      return res.status(200).json({ ok: false, message: 'Missing Shopify credentials' });
    }

    // Client Credentials Access Token Exchange
    const tokenResponse = await fetch(`https://${domain}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      })
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      return res.status(200).json({ ok: false, error: 'Token exchange failed', details: errText });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // --- GET METHOD: FETCH PRODUCTS ---
    if (req.method === 'GET') {
      const productsResponse = await fetch(`https://${domain}/admin/api/2024-01/products.json`, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });
      const productsData = await productsResponse.json();
      return res.status(200).json({ ok: true, products: productsData.products || [] });
    }

    // --- POST METHOD: CREATE SHOPIFY ORDER ---
    if (req.method === 'POST') {
      const orderPayload = req.body;
      const createOrderResponse = await fetch(`https://${domain}/admin/api/2024-01/orders.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      const orderData = await createOrderResponse.json();
      return res.status(200).json({ ok: createOrderResponse.ok, data: orderData });
    }

  } catch (error) {
    return res.status(200).json({ ok: false, error: error.message });
  }
}
