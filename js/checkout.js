document.addEventListener('DOMContentLoaded', () => {
  console.log("Checkout Script Loaded Successfully!");

  // 1. Load Cart Items & Calculate Totals
  function renderOrderSummary() {
    const cartData = localStorage.getItem('cart') || localStorage.getItem('wishzy_cart');
    const cart = cartData ? JSON.parse(cartData) : [];

    const itemCountEl = document.getElementById('item-count');
    const orderItemsEl = document.getElementById('order-items');
    const subtotalEl = document.getElementById('order-subtotal');
    const totalEl = document.getElementById('order-total');

    if (!cart || cart.length === 0) {
      if (itemCountEl) itemCountEl.innerText = '0';
      if (orderItemsEl) orderItemsEl.innerHTML = '<p class="text-muted">Your cart is empty.</p>';
      if (subtotalEl) subtotalEl.innerText = '₹0';
      if (totalEl) totalEl.innerText = '₹0';
      return;
    }

    let subtotal = 0;
    let itemsHTML = '<ul style="list-style:none;padding:0;margin:0 0 15px 0;">';

    cart.forEach(item => {
      const priceNum = Number(String(item.price || 0).replace(/[^0-9.]/g, ''));
      const qty = Number(item.quantity || 1);
      const itemTotal = priceNum * qty;
      subtotal += itemTotal;

      itemsHTML += `
        <li style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.9rem;">
          <span>${item.title || item.name} (x${qty})</span>
          <strong>₹${itemTotal}</strong>
        </li>
      `;
    });

    itemsHTML += '</ul>';

    if (itemCountEl) itemCountEl.innerText = cart.length;
    if (orderItemsEl) orderItemsEl.innerHTML = itemsHTML;
    if (subtotalEl) subtotalEl.innerText = `₹${subtotal}`;
    if (totalEl) totalEl.innerText = `₹${subtotal}`;
  }

  // Initial Summary Render
  renderOrderSummary();

  // 2. Handle Form Submission
  const codForm = document.getElementById('cod-form');

  if (codForm) {
    codForm.addEventListener('submit', async function(e) {
      e.preventDefault(); // <-- Ab ID match hone ki wajah se URL reload HAMESHA RUK "JAYEGA"!

      console.log("Submitting Order to Shopify...");

      // Read Cart
      const cartData = localStorage.getItem('cart') || localStorage.getItem('wishzy_cart');
      const cart = cartData ? JSON.parse(cartData) : [];

      if (!cart || cart.length === 0) {
        alert("Aapka cart khali hai!");
        return;
      }

      // Read Exact Form Fields from HTML
      const name = document.getElementById('f-name')?.value || 'Customer';
      const mobile = document.getElementById('f-mobile')?.value || '';
      const email = document.getElementById('f-email')?.value || '';
      const address = document.getElementById('f-address')?.value || '';
      const pincode = document.getElementById('f-pincode')?.value || '';
      const city = document.getElementById('f-city')?.value || '';
      const state = document.getElementById('f-state')?.value || '';

      const fullAddress = `${address}, Pincode: ${pincode}`;

    // Build Shopify Payload (Phone conflict fix)
      const orderPayload = {
        order: {
          line_items: cart.map(item => ({
            title: item.title || item.name || "Product",
            price: String(item.price || "0").replace(/[^0-9.]/g, ''),
            quantity: item.quantity || 1
          })),
          phone: mobile,
          email: email || undefined,
          shipping_address: {
            first_name: name,
            address1: fullAddress,
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
        const placeBtn = document.getElementById('place-order-btn');
        if (placeBtn) {
          placeBtn.disabled = true;
          placeBtn.innerText = "⏳ Placing Order...";
        }

        const res = await fetch('/api/shopify-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });

        const responseData = await res.json();
        console.log("Shopify Response:", responseData);

        if (responseData.ok && responseData.data?.order) {
          localStorage.removeItem('cart');
          localStorage.removeItem('wishzy_cart');
          alert("🎉 Order Placed Successfully! Order ID: " + responseData.data.order.name);
          window.location.href = '/';
        } else {
          alert("Shopify Error: " + (responseData.data?.errors ? JSON.stringify(responseData.data.errors) : "Failed to place order"));
          if (placeBtn) {
            placeBtn.disabled = false;
            placeBtn.innerText = "💰 Confirm Cash on Delivery Order";
          }
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        alert("Network Error during checkout!");
      }
    });
  }
});
