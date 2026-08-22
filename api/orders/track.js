export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { orderNumber, identifier } = req.body;

    if (!orderNumber || !identifier) {
      return res.status(400).json({ success: false, error: 'Missing order number or email/phone' });
    }

    const rawDomain = process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_URL || 'joyroo.myshopify.com';
    const shopifyDomain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
       return res.status(500).json({ success: false, error: 'Missing Shopify Client ID or Secret in environment variables' });
    }

    // 2026 Shopify Update: Fetch short-lived token via Client Credentials Grant
    const tokenRes = await fetch(`https://${shopifyDomain}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      })
    });

    if (!tokenRes.ok) {
       return res.status(500).json({ success: false, error: 'Failed to authenticate with Shopify using Client Credentials' });
    }

    const tokenData = await tokenRes.json();
    const shopifyToken = tokenData.access_token;

    const cleanOrderNumber = orderNumber.toString().replace('#', '');
    const shopifyUrl = `https://${shopifyDomain}/admin/api/2024-01/orders.json?name=${cleanOrderNumber}&status=any`;
    
    const response = await fetch(shopifyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken,
      }
    });

    if (!response.ok) throw new Error('Failed to fetch from Shopify');

    const data = await response.json();
    const orders = data.orders;

    if (!orders || orders.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = orders[0];

    const formattedIdentifier = identifier.trim().toLowerCase();
    const orderEmail = (order.email || '').toLowerCase();
    const orderPhone = (order.phone || '').replace(/\D/g, '');
    const inputPhone = formattedIdentifier.replace(/\D/g, '');

    const isMatch = (orderEmail && orderEmail === formattedIdentifier) || 
                    (orderPhone && inputPhone && orderPhone.includes(inputPhone)) ||
                    (order.customer?.phone && inputPhone && order.customer.phone.replace(/\D/g, '').includes(inputPhone));

    if (!isMatch) {
      return res.status(403).json({ success: false, error: 'Order found, but email/phone does not match our records' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Track Order API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
