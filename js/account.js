const WishzyAccount = (() => {
  const S = window.WishzyStore;
  let currentUserPhone = null;

  const init = () => {
    const customer = S.getLoggedInCustomer();
    if (customer && customer.mobile) {
      currentUserPhone = customer.mobile;
      showDashboard();
      fetchOrders();
    } else {
      showLogin();
    }
  };

  const showLogin = () => {
    document.getElementById('account-login-view').style.display = 'block';
    document.getElementById('account-dashboard-view').style.display = 'none';
  };

  const showDashboard = () => {
    document.getElementById('account-login-view').style.display = 'none';
    document.getElementById('account-dashboard-view').style.display = 'block';
  };

  const login = async () => {
    const phoneInput = document.getElementById('login-phone');
    const phone = phoneInput.value.trim();
    if (phone.length < 10) {
      window.WishzyUI?.toast('Please enter a valid mobile number.', 'warning');
      return;
    }
    
    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Searching Orders...';

    currentUserPhone = phone;
    // Assume success for UX, load dashboard
    S.loginCustomer({ mobile: phone });
    showDashboard();
    await fetchOrders();
    
    btn.disabled = false;
    btn.textContent = '🔓 Secure Login';
  };

  const logout = () => {
    S.logoutCustomer();
    currentUserPhone = null;
    showLogin();
    document.getElementById('orders-list').innerHTML = '';
  };

  const fetchOrders = async () => {
    if (!currentUserPhone) return;
    
    const btn = document.getElementById('refresh-orders-btn');
    if(btn) btn.textContent = '⏳ Loading...';
    
    const listEl = document.getElementById('orders-list');
    listEl.innerHTML = '<p style="text-align:center;padding:20px;color:var(--clr-muted)">Fetching live details from Shopify...</p>';

    try {
      const response = await fetch('/api/orders/customer-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: currentUserPhone })
      });
      
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      
      if (data.orders && data.orders.length > 0) {
        // Success! Render Shopify orders and DO NOT overwrite with empty local storage!
        renderOrders(data.orders);
      } else {
        // No orders in Shopify, check local storage as fallback
        const localOrders = S.getOrders().filter(o => o.customer.mobile === currentUserPhone);
        if(localOrders.length > 0) {
           renderLocalOrders(localOrders);
        } else {
           listEl.innerHTML = '<p style="text-align:center;padding:30px;color:var(--clr-muted);background:var(--clr-bg);border-radius:10px">No orders found for this mobile number.</p>';
        }
      }
    } catch (e) {
      console.error(e);
      // Backend failed, fallback to local
      const localOrders = S.getOrders().filter(o => o.customer.mobile === currentUserPhone);
      if(localOrders.length > 0) {
         renderLocalOrders(localOrders);
      } else {
         listEl.innerHTML = '<p style="text-align:center;padding:30px;color:var(--clr-error);background:rgba(255,59,48,0.1);border-radius:10px">Could not connect to live tracking. Please try again later.</p>';
      }
    }
    
    if(btn) btn.textContent = '🔄 Refresh';
  };

  const renderOrders = (orders) => {
    const listEl = document.getElementById('orders-list');
    
    let html = '';
    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const itemsCount = order.line_items ? order.line_items.reduce((acc, item) => acc + item.quantity, 0) : 0;
      
      // Determine status pill
      let statusHtml = '<span class="pill pill--warning">🔄 Processing</span>';
      if (order.fulfillment_status === 'fulfilled') {
        statusHtml = '<span class="pill pill--success">✅ Fulfilled</span>';
      } else if (order.cancelled_at) {
        statusHtml = '<span class="pill pill--error">❌ Cancelled</span>';
      }

      html += `
        <div class="card" style="padding:var(--space-lg); margin-bottom:var(--space-md); border:1px solid var(--clr-border);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--space-md); flex-wrap:wrap; gap:10px;">
            <div>
              <div class="fw-700" style="font-size:1.1rem; color:var(--clr-text)">Order #${order.order_number}</div>
              <div class="caption text-muted">${date}</div>
            </div>
            ${statusHtml}
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-md); background:var(--clr-bg-alt); padding:var(--space-md); border-radius:var(--radius-sm); margin-bottom:var(--space-md);">
            <div><span class="caption text-muted block mb-xs">Items</span><span class="fw-600">${itemsCount}</span></div>
            <div><span class="caption text-muted block mb-xs">Total Amount</span><span class="fw-600 text-accent">₹${order.total_price}</span></div>
          </div>
          <a href="track-order.html?id=${order.order_number}&phone=${currentUserPhone}" class="btn btn--outline btn--sm" style="width:100%; text-align:center;">
            Track Order Live 📦
          </a>
        </div>
      `;
    });
    
    listEl.innerHTML = html;
  };

  const renderLocalOrders = (orders) => {
    const listEl = document.getElementById('orders-list');
    let html = '<div style="margin-bottom:15px; font-size:0.85rem; color:#f39c12;">Showing local device history (live sync failed).</div>';
    
    orders.forEach(order => {
      const date = new Date(order.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const itemsCount = order.cart.reduce((acc, item) => acc + item.qty, 0);
      
      html += `
        <div class="card" style="padding:var(--space-lg); margin-bottom:var(--space-md); border:1px dashed var(--clr-border);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--space-md);">
            <div>
              <div class="fw-700" style="font-size:1.1rem;">Order #${order.orderId}</div>
              <div class="caption text-muted">${date}</div>
            </div>
            <span class="pill pill--info">Local Pending</span>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-md); background:var(--clr-bg-alt); padding:var(--space-md); border-radius:var(--radius-sm); margin-bottom:var(--space-md);">
            <div><span class="caption text-muted block mb-xs">Items</span><span class="fw-600">${itemsCount}</span></div>
            <div><span class="caption text-muted block mb-xs">Total Amount</span><span class="fw-600 text-accent">₹${order.total}</span></div>
          </div>
          <a href="track-order.html?id=${order.orderId}&phone=${currentUserPhone}" class="btn btn--outline btn--sm" style="width:100%; text-align:center;">
            Track Order Live 📦
          </a>
        </div>
      `;
    });
    
    listEl.innerHTML = html;
  };

  return { init, login, logout, fetchOrders };
})();

document.addEventListener('DOMContentLoaded', WishzyAccount.init);
