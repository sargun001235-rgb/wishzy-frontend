// 1. Checkout Form Submit Handler
document.querySelector('form').addEventListener('submit', async function(e) {
  e.preventDefault(); // <-- Loop aur URL refresh hone se rokega!

  // Cart LocalStorage se read karo
  const cartData = localStorage.getItem('cart') || localStorage.getItem('wishzy_cart');
  const cart = cartData ? JSON.parse(cartData) : [];

  if (cart.length === 0) {
    alert("Tera cart khali hai!");
    return;
  }

  // Input Values Get Karo
  const name = document.querySelector('input[name="name"]')?.value || 'Customer';
  const mobile = document.querySelector('input[name="mobile"]')?.value || '';
  const address = document.querySelector('input[name="address"]')?.value || '';
  const city = document.querySelector('input[name="city"]')?.value || '';
  const state = document.querySelector('input[name="state"]')?.value || '';

  const orderPayload = {
    order: {
      line_items: cart.map(item => ({
        title: item.title,
        price: item.price,
        quantity: item.quantity || 1
      })),
      customer: {
        first_name: name,
        phone: mobile
      },
      shipping_address: {
        first_name: name,
        address1: address,
        city: city,
        province: state,
        country: "India",
        phone: mobile
      },
      financial_status: "pending",
      gateway: "Cash on Delivery (COD)"
    }
  };

  try {
    const res = await fetch('/api/shopify-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const data = await res.json();
    console.log("Order Created in Shopify:", data);

    // Cart Clear karo & Success Page par bhej do
    localStorage.removeItem('cart');
    localStorage.removeItem('wishzy_cart');
    
  alert("🎉 Order Placed Successfully! Order ID: " + (data?.data?.order?.name || 'Confirmed'));
window.location.href = '/';

  } catch (err) {
    console.error("Order submit failed:", err);
    alert("Order place karne mein error aaya!");
  }
});
