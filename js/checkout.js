async function sendOrderToShopify(customerDetails, cartItems) {
  try {
    const payload = {
      order: {
        line_items: cartItems.map(item => ({
          title: item.title,
          price: item.price,
          quantity: item.quantity
        })),
        customer: {
          first_name: customerDetails.name,
          phone: customerDetails.phone
        },
        shipping_address: {
          first_name: customerDetails.name,
          address1: customerDetails.address,
          city: customerDetails.city,
          province: customerDetails.state,
          country: "India",
          phone: customerDetails.phone
        },
        financial_status: "pending",
        gateway: "Cash on Delivery (COD)"
      }
    };

    const res = await fetch('/api/shopify-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Shopify Order Response:", data);
    return data;
  } catch (err) {
    console.error("Order Push Failed:", err);
  }
}
