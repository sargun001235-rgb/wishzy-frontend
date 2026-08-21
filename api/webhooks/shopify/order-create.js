export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Shopify-Topic, X-Shopify-Hmac-Sha256, X-Shopify-Shop-Domain, X-Shopify-API-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const order = req.body;
    
    // In production, always verify the X-Shopify-Hmac-Sha256 header here!
    
    const orderNumber = order.order_number;
    const phone = order.phone || (order.customer && order.customer.phone);
    const customerName = order.customer ? order.customer.first_name : 'Customer';

    if (!phone) {
      console.log('No phone number provided, skipping notification.');
      return res.status(200).json({ success: true, message: 'No phone number provided' });
    }

    // Generate the direct tracking link
    const trackLink = `https://wishzy.in/track-order.html?id=${orderNumber}&phone=${encodeURIComponent(phone)}`;

    // Prepare a mock payload for WhatsApp/SMS providers (e.g. Twilio, Interakt, Wati)
    const notificationPayload = {
      to: phone,
      message: `Hi ${customerName}! Your order #${orderNumber} is confirmed. Track it live here: ${trackLink}`
    };

    console.log('Sending Notification:', notificationPayload);
    // await fetch('YOUR_WHATSAPP_API_ENDPOINT', { method: 'POST', body: JSON.stringify(notificationPayload) });

    res.status(200).json({ success: true, delivered: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
