/* ============================================================
   WISHZY — Checkout & COD Logic
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const S = window.WishzyStore;

  /* ── RENDER ORDER SUMMARY ─────────────────────────────────── */
  const renderSummary = () => {
    const cart = S.getCart();
    const totals = S.getCartTotals();

    const itemsEl = document.getElementById('order-items');
    const subtotalEl = document.getElementById('order-subtotal');
    const shippingEl = document.getElementById('order-shipping');
    const totalEl = document.getElementById('order-total');
    const countEl = document.getElementById('item-count');

    if (!itemsEl) return;

    if (!cart.length) {
      itemsEl.innerHTML = '<p class="caption" style="text-align:center;padding:var(--space-lg)">Your cart is empty.</p>';
    } else {
      itemsEl.innerHTML = cart.map(item => `
        <div class="order-item">
          <img class="order-item__img" src="${item.image}" alt="${item.title}">
          <div class="order-item__info">
            <div class="order-item__name">${item.title}</div>
            <div class="order-item__qty">Qty: ${item.qty}</div>
          </div>
          <div class="order-item__price">${S.formatPrice(item.price * item.qty)}</div>
        </div>
      `).join('');
    }

    if (subtotalEl) subtotalEl.textContent = S.formatPrice(totals.subtotal);
    if (shippingEl) shippingEl.textContent = totals.shipping === 0 ? 'FREE' : S.formatPrice(totals.shipping);
    if (totalEl) totalEl.textContent = S.formatPrice(totals.total);
    if (countEl) countEl.textContent = totals.count;
  };

  /* ── FORM VALIDATION ──────────────────────────────────────── */
  const validateField = (input) => {
    const val = input.value.trim();
    const name = input.name;
    let valid = true;
    let msg = '';

    if (!val) { valid = false; msg = 'This field is required.'; }
    else if (name === 'mobile' && !/^[6-9]\d{9}$/.test(val)) { valid = false; msg = 'Enter a valid 10-digit mobile number.'; }
    else if (name === 'pincode' && !/^\d{6}$/.test(val)) { valid = false; msg = 'Enter a valid 6-digit pincode.'; }

    const errEl = input.parentElement.querySelector('.field-error');
    if (errEl) { errEl.textContent = msg; errEl.style.display = msg ? 'block' : 'none'; }
    input.style.borderColor = valid ? '' : 'var(--clr-error)';
    return valid;
  };

  /* ── FORM SUBMIT ──────────────────────────────────────────── */
  const form = document.getElementById('cod-form');
  if (form) {
    // Live validation
    form.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        if (input.style.borderColor === 'var(--clr-error)') validateField(input);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validate all fields
      const fields = form.querySelectorAll('input[required], select[required]');
      let allValid = true;
      fields.forEach(f => { if (!validateField(f)) allValid = false; });
      if (!allValid) { window.WishzyUI?.toast('Please fix the errors above.', 'error'); return; }

      const cart = S.getCart();
      if (!cart.length) { window.WishzyUI?.toast('Your cart is empty!', 'error'); return; }

      // Collect form data
      const data = Object.fromEntries(new FormData(form));

      // Show loading
      const btn = form.querySelector('#place-order-btn');
      btn.disabled = true;
      btn.textContent = '⏳ Placing Order...';

      // Simulate processing
      setTimeout(async () => {
        const order = S.placeOrder(data);
        if (order) {
          
          // --- Secure Shopify Auto-Sync ---
          try {
            btn.textContent = '☁️ Syncing with Shopify...';
            
            const payload = {
              order: {
                note: "Imported from Wishzy COD via Checkout (Secure)",
                tags: "Wishzy, COD",
                financial_status: "pending",
                line_items: order.items.map(item => ({
                  title: item.title,
                  price: item.price,
                  quantity: item.qty
                })),
                customer: {
                  first_name: order.customer.name.split(' ')[0] || order.customer.name,
                  last_name: order.customer.name.split(' ').slice(1).join(' ') || '.',
                  phone: order.customer.mobile
                },
                shipping_address: {
                  address1: order.customer.address,
                  city: order.customer.city,
                  province: order.customer.state,
                  zip: order.customer.pincode,
                  country: "IN"
                }
              }
            };

            const response = await fetch('/api/shopify-proxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'push_order', payload })
            });
            
            if (response.ok) {
              const resData = await response.json();
              if (resData.success) {
                order.shopifySyncId = resData.order.id;
                // Update local storage so it shows as synced in admin panel
                const allOrders = S.getOrders();
                const index = allOrders.findIndex(o => o.id === order.id);
                if (index !== -1) {
                  allOrders[index] = order;
                  localStorage.setItem('wishzy_orders', JSON.stringify(allOrders));
                }
              }
            }
          } catch(e) {
            console.error('Shopify secure sync failed during checkout:', e);
            // We swallow the error so the customer still goes to the thankyou page seamlessly
          }
          // ------------------------

          sessionStorage.setItem('wishzy_last_order', JSON.stringify(order));
          window.location.href = 'thankyou.html';
        } else {
          btn.disabled = false;
          btn.textContent = '💰 Confirm Cash on Delivery Order';
          window.WishzyUI?.toast('Something went wrong. Please try again.', 'error');
        }
      }, 800);
    });
  }

  // Auto-fill pincode → city mock
  const pincodeInput = document.getElementById('f-pincode');
  if (pincodeInput) {
    const cityMap = { '110': 'New Delhi', '400': 'Mumbai', '560': 'Bengaluru', '600': 'Chennai', '700': 'Kolkata', '500': 'Hyderabad', '380': 'Ahmedabad', '411': 'Pune' };
    pincodeInput.addEventListener('input', () => {
      const pin = pincodeInput.value;
      if (pin.length >= 3) {
        const prefix = pin.substring(0, 3);
        const cityInput = document.getElementById('f-city');
        if (cityInput && cityMap[prefix]) {
          cityInput.value = cityMap[prefix];
          document.getElementById('f-state').value = 'State Name';
          cityInput.style.borderColor = 'var(--clr-success)';
          setTimeout(() => cityInput.style.borderColor = '', 2000);
        }
      }
    });
  }

  // Pre-fill form if logged in
  const loggedInCustomer = S.getLoggedInCustomer();
  if (loggedInCustomer) {
    if(document.getElementById('f-name')) document.getElementById('f-name').value = loggedInCustomer.name || '';
    if(document.getElementById('f-mobile')) document.getElementById('f-mobile').value = loggedInCustomer.mobile || '';
    if(document.getElementById('f-pincode')) document.getElementById('f-pincode').value = loggedInCustomer.pincode || '';
    if(document.getElementById('f-address')) document.getElementById('f-address').value = loggedInCustomer.address || '';
    if(document.getElementById('f-city')) document.getElementById('f-city').value = loggedInCustomer.city || '';
    if(document.getElementById('f-state')) document.getElementById('f-state').value = loggedInCustomer.state || '';
  }

  renderSummary();
});
