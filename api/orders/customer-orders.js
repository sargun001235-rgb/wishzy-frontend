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

    const shopifyDomain = process.env.SHOPIFY_STORE_URL || 'joyroo.myshopify.com';
    const shopifyToken = process.env.SHOPIFY_ADMIN_API_TOKEN;

    if (!shopifyToken) {
       return res.status(500).json({ success: false, error: 'Missing Shopify Admin Token' });
    }

    const searchUrl = `https://${shopifyDomain}/admin/api/2024-01/customers/search.json?query=${encodeURIComponent(identifier)}`;
    
    const customerRes = await fetch(searchUrl, {
      headers: { 'X-Shopify-Access-Token': shopifyToken }
    });
    
    if (!customerRes.ok) throw new Error('Failed to query Shopify customers');
    
    const customerData = await customerRes.json();
    if (!customerData.customers || customerData.customers.length === 0) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const customerId = customerData.customers[0].id;

    const ordersUrl = `https://${shopifyDomain}/admin/api/2024-01/customers/${customerId}/orders.json?status=any`;
    const ordersRes = await fetch(ordersUrl, {
      headers: { 'X-Shopify-Access-Token': shopifyToken }
    });
    
    if (!ordersRes.ok) throw new Error('Failed to query Shopify orders');

    const ordersData = await ordersRes.json();
    res.status(200).json({ success: true, orders: ordersData.orders });

  } catch (error) {
    console.error('Customer Orders API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
