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
      const response = await fetch('/api/shopify-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_customer_orders', payload: { phone: currentUserPhone } })
      });
      
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      
      if (data.orders && data.orders.length > 0) {
        renderOrders(data.orders);
        // Opportunistically save the latest name if available in the order
        const latestName = data.orders[0].name; // this is the order number actually e.g. #1001
      } else {
        // Fallback to local storage orders if backend fails or has no record
        const localOrders = S.getOrders().filter(o => o.customer.mobile === currentUserPhone);
        if(localOrders.length > 0) {
           renderLocalOrders(localOrders);
        } else {
           listEl.innerHTML = '<p style="text-align:center;padding:30px;color:var(--clr-muted);background:var(--clr-bg);border-radius:10px">No orders found for this mobile number.</p>';
        }
      }
    } catch (e) {
      console.error(e);
      // Fallback to local
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
    
    listEl.innerHTML = orders.map(order => {
      const date = new Date(order.createdAt).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'});
      const total = order.totalPriceSet?.shopMoney?.amount || 0;
      const fStatus = order.displayFulfillmentStatus === 'FULFILLED' ? 'Shipped' : (order.displayFulfillmentStatus || 'Processing');
      const pStatus = order.displayFinancialStatus || 'Pending';
      
      let trackingHtml = '';
      if (order.fulfillments && order.fulfillments.length > 0) {
        const tracking = order.fulfillments[0].trackingInfo;
        if (tracking && tracking.length > 0) {
          const tInfo = tracking[0];
          trackingHtml = `
            <div style="margin-top:15px;padding:12px;background:var(--clr-bg);border-radius:8px;border:1px dashed var(--clr-primary)">
              <div style="font-size:0.8rem;color:var(--clr-muted);margin-bottom:4px">Tracking Number: <strong style="color:var(--clr-text)">${tInfo.number}</strong></div>
              ${tInfo.url ? `<a href="${tInfo.url}" target="_blank" class="btn btn--primary" style="padding:6px 12px;font-size:0.8rem;display:inline-block">Track Package 🚚</a>` : ''}
            </div>
          `;
        }
      }

      const itemsHtml = order.lineItems.edges.map(e => `
        <div style="display:flex;align-items:center;gap:10px;margin-top:10px">
          ${e.node.image?.url ? `<img src="${e.node.image.url}" style="width:40px;height:40px;border-radius:6px;object-fit:cover">` : ''}
          <div style="font-size:0.85rem;line-height:1.3">
            <div style="color:var(--clr-text)">${e.node.title}</div>
            <div style="color:var(--clr-muted)">Qty: ${e.node.quantity}</div>
          </div>
        </div>
      `).join('');

      return `
        <div style="padding:20px;border:1px solid var(--clr-border);border-radius:12px;margin-bottom:15px">
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--clr-border);padding-bottom:12px;margin-bottom:12px">
            <div>
              <div style="font-weight:700;color:var(--clr-text)">Order ${order.name}</div>
              <div style="font-size:0.8rem;color:var(--clr-muted)">${date}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:700;color:var(--clr-primary)">₹${parseFloat(total).toLocaleString('en-IN')}</div>
              <span style="display:inline-block;padding:2px 8px;background:rgba(123,97,255,0.1);color:var(--clr-primary);border-radius:20px;font-size:0.7rem;font-weight:600;margin-top:4px">${fStatus}</span>
            </div>
          </div>
          ${itemsHtml}
          ${trackingHtml}
        </div>
      `;
    }).join('');
  };

  const renderLocalOrders = (orders) => {
    const listEl = document.getElementById('orders-list');
    listEl.innerHTML = orders.map(order => {
      const date = new Date(order.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'});
      const itemsHtml = order.items.map(item => `
        <div style="display:flex;align-items:center;gap:10px;margin-top:10px">
          <img src="${item.images[0]}" style="width:40px;height:40px;border-radius:6px;object-fit:cover">
          <div style="font-size:0.85rem;line-height:1.3">
            <div style="color:var(--clr-text)">${item.title}</div>
            <div style="color:var(--clr-muted)">Qty: ${item.qty}</div>
          </div>
        </div>
      `).join('');

      return `
        <div style="padding:20px;border:1px solid var(--clr-border);border-radius:12px;margin-bottom:15px">
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--clr-border);padding-bottom:12px;margin-bottom:12px">
            <div>
              <div style="font-weight:700;color:var(--clr-text)">Order ${order.id}</div>
              <div style="font-size:0.8rem;color:var(--clr-muted)">${date}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:700;color:var(--clr-primary)">₹${order.total.toLocaleString('en-IN')}</div>
              <span style="display:inline-block;padding:2px 8px;background:rgba(123,97,255,0.1);color:var(--clr-primary);border-radius:20px;font-size:0.7rem;font-weight:600;margin-top:4px">${order.status}</span>
            </div>
          </div>
          ${itemsHtml}
          <div style="margin-top:15px;font-size:0.8rem;color:var(--clr-muted)">Tracking info is syncing from Shopify...</div>
        </div>
      `;
    }).join('');
  };

  return { init, login, logout, fetchOrders };
})();

document.addEventListener('DOMContentLoaded', WishzyAccount.init);
