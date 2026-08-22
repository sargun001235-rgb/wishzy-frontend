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
    const { identifier } = req.body;
    
    if (!identifier) {
      return res.status(400).json({ success: false, error: 'Missing customer identifier' });
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

    const searchUrl = `https://${shopifyDomain}/admin/api/2024-01/customers/search.json?query=${encodeURIComponent(identifier)}`;
    
    const customerRes = await fetch(searchUrl, {
      headers: { 'X-Shopify-Access-Token': shopifyToken }
    });
    
    if (!customerRes.ok) throw new Error('Failed to query Shopify customers');
    
    const customerData = await customerRes.json();
    if (!customerData.customers || customerData.customers.length === 0) {
      return res.status(200).json({ success: true, orders: [] });
    }

    let allOrders = [];

    for (const customer of customerData.customers) {
      const ordersUrl = `https://${shopifyDomain}/admin/api/2024-01/customers/${customer.id}/orders.json?status=any`;
      const ordersRes = await fetch(ordersUrl, {
        headers: { 'X-Shopify-Access-Token': shopifyToken }
      });
      
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        if (ordersData.orders) {
          allOrders = allOrders.concat(ordersData.orders);
        }
      }
    }

    // Deduplicate orders by ID in case Shopify returned the same order multiple times
    const uniqueOrdersMap = new Map();
    for (const order of allOrders) {
      uniqueOrdersMap.set(order.id, order);
    }
    
    // Sort by created_at descending
    const sortedOrders = Array.from(uniqueOrdersMap.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.status(200).json({ success: true, orders: sortedOrders });

  } catch (error) {
    console.error('Customer Orders API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
