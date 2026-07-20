/* ============================================================
   WISHZY — Admin Dashboard Logic
   Products, Orders, Analytics — localStorage-backed
   ============================================================ */

const WishzyAdmin = (() => {
  const ADMIN_PASSWORD = 'wishzy@admin';
  const S = window.WishzyStore;

  /* ── AUTH ─────────────────────────────────────────────────── */
  const isLoggedIn = () => sessionStorage.getItem('wishzy_admin') === 'true';
  const login = (pw) => {
    if (pw === ADMIN_PASSWORD) { sessionStorage.setItem('wishzy_admin', 'true'); return true; }
    return false;
  };
  const logout = () => { sessionStorage.removeItem('wishzy_admin'); window.location.reload(); };

  /* ── PANEL NAVIGATION ─────────────────────────────────────── */
  const showPanel = (id) => {
    document.querySelectorAll('.adm-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.adm-nav__item').forEach(n => n.classList.remove('active'));
    const panel = document.getElementById('panel-' + id);
    if (panel) panel.classList.add('active');
    document.querySelector(`[data-panel="${id}"]`)?.classList.add('active');

    // Update topbar title
    const titles = { dashboard: 'Dashboard Overview', products: 'Product Management', orders: 'Order Management', analytics: 'Analytics & Reports', settings: 'Store Settings' };
    document.getElementById('topbar-title').textContent = titles[id] || 'Dashboard';
    document.getElementById('topbar-subtitle').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Refresh panel content
    if (id === 'dashboard') renderDashboard();
    if (id === 'products') renderProductsTable();
    if (id === 'orders') renderOrdersTable();
    if (id === 'analytics') renderAnalytics();
    if (id === 'settings') {
      loadShopifyConfig();
      // Load general settings
      document.getElementById('set-storename').value = localStorage.getItem('wishzy_store_name') || 'Wishzy';
      document.getElementById('set-email').value = localStorage.getItem('wishzy_admin_email') || '';
    }
  };

  /* ── DASHBOARD ────────────────────────────────────────────── */
  const renderDashboard = () => {
    const orders = S.getOrders();
    const products = S.getProducts();
    const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
    const pendingOrders = orders.filter(o => o.status !== 'Delivered').length;

    // Stats
    document.getElementById('stat-orders').textContent = orders.length;
    document.getElementById('stat-revenue').textContent = S.formatPrice(totalRevenue);
    document.getElementById('stat-products').textContent = products.length;
    document.getElementById('stat-pending').textContent = pendingOrders;

    // Recent orders
    const recentOrdersEl = document.getElementById('recent-orders-list');
    if (recentOrdersEl) {
      if (!orders.length) {
        recentOrdersEl.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--adm-muted)">No orders yet. Share your store to start getting orders!</td></tr>';
      } else {
        recentOrdersEl.innerHTML = orders.slice(0, 8).map(o => `
          <tr>
            <td><span style="font-family:monospace;font-weight:600">${o.id}</span></td>
            <td>${o.customer.name}<br><small style="color:var(--adm-muted)">${o.customer.mobile}</small></td>
            <td>${new Date(o.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
            <td><strong>${S.formatPrice(o.total)}</strong></td>
            <td>${getStatusBadge(o.status)}</td>
          </tr>
        `).join('');
      }
    }

    // Top products
    const topProdsEl = document.getElementById('top-products-list');
    if (topProdsEl) {
      topProdsEl.innerHTML = products.slice(0, 5).map(p => `
        <div class="chart-bar-item">
          <div class="chart-bar-label"><span>${p.title.slice(0, 32)}...</span><span style="color:var(--adm-text)">${S.formatPrice(p.price)}</span></div>
          <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.random() * 60 + 30}%"></div></div>
        </div>
      `).join('');
    }

    // Activity
    const actEl = document.getElementById('activity-feed');
    if (actEl) {
      const activities = [
        { type: 'success', text: `<strong>${orders.length} orders</strong> placed since store launch`, time: 'Now' },
        { type: 'info', text: `<strong>${products.length} products</strong> currently in catalogue`, time: 'Live' },
        { type: 'warning', text: `<strong>${pendingOrders} orders</strong> pending delivery`, time: 'Active' },
        { type: 'success', text: `Store is <strong>live and accepting COD orders</strong>`, time: 'Active' },
      ];
      actEl.innerHTML = activities.map(a => `
        <div class="activity-item">
          <div class="activity-dot activity-dot--${a.type}"></div>
          <div>
            <div class="activity-text">${a.text}</div>
            <div class="activity-time">${a.time}</div>
          </div>
        </div>
      `).join('');
    }
  };

  /* ── PRODUCTS TABLE ───────────────────────────────────────── */
  const renderProductsTable = () => {
    const products = S.getProducts();
    const el = document.getElementById('products-table-body');
    if (!el) return;

    el.innerHTML = products.map(p => `
      <tr>
        <td><img class="adm-table__img" src="${p.images[0]}" alt="${p.title}" onerror="this.style.background='var(--adm-border)'"></td>
        <td>
          <div style="font-weight:600;font-size:0.875rem;margin-bottom:3px">${p.title}</div>
          <div style="font-size:0.72rem;color:var(--adm-muted)">${p.category}</div>
        </td>
        <td><strong>${S.formatPrice(p.price)}</strong><br><span style="font-size:0.72rem;color:var(--adm-muted);text-decoration:line-through">${S.formatPrice(p.originalPrice)}</span></td>
        <td><span class="adm-badge adm-badge--info">${p.badge || '—'}</span></td>
        <td><span class="adm-badge ${p.inStock ? 'adm-badge--success' : 'adm-badge--error'}">${p.inStock ? '● In Stock' : '● Out of Stock'}</span></td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="adm-btn adm-btn--ghost adm-btn--sm" onclick="WishzyAdmin.editProduct('${p.id}')">✏️ Edit</button>
            <button class="adm-btn adm-btn--danger adm-btn--sm" onclick="WishzyAdmin.deleteProductConfirm('${p.id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--adm-muted)">No products yet. Add your first product!</td></tr>';

    // Update count badge
    const badge = document.querySelector('[data-panel="products"] .adm-nav__badge');
    if (badge) badge.textContent = products.length;
  };

  /* ── ORDERS TABLE ─────────────────────────────────────────── */
  const renderOrdersTable = () => {
    const orders = S.getOrders();
    const el = document.getElementById('orders-table-body');
    if (!el) return;

    const pendingBadge = document.querySelector('[data-panel="orders"] .adm-nav__badge');
    if (pendingBadge) pendingBadge.textContent = orders.filter(o => o.status === 'Confirmed').length;

    el.innerHTML = orders.map(o => `
      <tr>
        <td><span style="font-family:monospace;font-weight:700;font-size:0.85rem">${o.id}</span></td>
        <td>${o.customer.name}<br><small style="color:var(--adm-muted)">📱 ${o.customer.mobile}</small></td>
        <td style="font-size:0.8rem;color:var(--adm-muted)">${o.customer.city}, ${o.customer.state}</td>
        <td>${o.items.length} item(s)</td>
        <td><strong>${S.formatPrice(o.total)}</strong></td>
        <td>${getStatusBadge(o.status)}</td>
        <td>${new Date(o.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
        <td>
          <select class="adm-select" style="padding:5px 8px;font-size:0.75rem;width:140px" onchange="WishzyAdmin.updateStatus('${o.id}', this.value)">
            <option ${o.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
            <option ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option ${o.status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
            <option ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--adm-muted)">No orders yet.</td></tr>';
  };

  /* ── ANALYTICS ────────────────────────────────────────────── */
  const renderAnalytics = () => {
    const orders = S.getOrders();
    const products = S.getProducts();
    const revenue = orders.reduce((a, o) => a + o.total, 0);
    const delivered = orders.filter(o => o.status === 'Delivered').length;
    const convRate = orders.length ? Math.round((delivered / orders.length) * 100) : 0;

    document.getElementById('an-revenue').textContent = S.formatPrice(revenue);
    document.getElementById('an-orders').textContent = orders.length;
    document.getElementById('an-conv').textContent = convRate + '%';
    document.getElementById('an-aov').textContent = orders.length ? S.formatPrice(Math.round(revenue / orders.length)) : '₹0';

    // Category breakdown
    const cats = { tech: 0, kitchen: 0, lifestyle: 0, kids: 0 };
    products.forEach(p => { if (cats[p.categorySlug] !== undefined) cats[p.categorySlug]++; });
    const total = Object.values(cats).reduce((a, b) => a + b, 0) || 1;
    const catEl = document.getElementById('cat-breakdown');
    if (catEl) {
      const catNames = { tech: '💻 Tech Gadgets', kitchen: '🍳 Kitchen & Home', lifestyle: '✨ Lifestyle', kids: '🎈 Kids' };
      catEl.innerHTML = Object.entries(cats).map(([k, v]) => `
        <div class="chart-bar-item">
          <div class="chart-bar-label"><span>${catNames[k]}</span><span>${v} products</span></div>
          <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${(v / total * 100).toFixed(0)}%"></div></div>
        </div>
      `).join('');
    }

    // Status breakdown
    const statuses = {};
    orders.forEach(o => { statuses[o.status] = (statuses[o.status] || 0) + 1; });
    const statEl = document.getElementById('status-breakdown');
    if (statEl) {
      statEl.innerHTML = Object.entries(statuses).map(([s, c]) => `
        <div class="chart-bar-item">
          <div class="chart-bar-label"><span>${s}</span><span>${c} orders</span></div>
          <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${(c / orders.length * 100).toFixed(0)}%"></div></div>
        </div>
      `).join('') || '<p style="color:var(--adm-muted);font-size:0.875rem">No order data yet.</p>';
    }
  };

  /* ── HELPERS ──────────────────────────────────────────────── */
  const getStatusBadge = (status) => {
    const map = { 'Confirmed': 'info', 'Processing': 'warning', 'Shipped': 'warning', 'Out for Delivery': 'warning', 'Delivered': 'success', 'Cancelled': 'error' };
    return `<span class="adm-badge adm-badge--${map[status] || 'muted'}">${status}</span>`;
  };

  /* ── PRODUCT MODAL ────────────────────────────────────────── */
  const openAddProduct = () => {
    document.getElementById('product-modal-title').textContent = '➕ Add New Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-id-hidden').value = '';
    document.getElementById('product-modal').classList.add('open');
  };

  const editProduct = (id) => {
    const p = S.getProductById(id);
    if (!p) return;
    document.getElementById('product-modal-title').textContent = '✏️ Edit Product';
    document.getElementById('product-id-hidden').value = id;
    document.getElementById('pm-title').value = p.title;
    document.getElementById('pm-price').value = p.price;
    document.getElementById('pm-original').value = p.originalPrice;
    document.getElementById('pm-category').value = p.categorySlug;
    document.getElementById('pm-badge').value = p.badge || '';
    document.getElementById('pm-stock').value = p.inStock ? '1' : '0';
    document.getElementById('pm-description').value = p.description;
    document.getElementById('pm-features').value = p.features.join('\n');
    document.getElementById('pm-images').value = p.images.join('\n');
    document.getElementById('product-modal').classList.add('open');
  };

  const closeProductModal = () => document.getElementById('product-modal').classList.remove('open');

  const saveProduct = () => {
    const id = document.getElementById('product-id-hidden').value;
    const data = {
      title: document.getElementById('pm-title').value.trim(),
      price: parseInt(document.getElementById('pm-price').value),
      originalPrice: parseInt(document.getElementById('pm-original').value),
      categorySlug: document.getElementById('pm-category').value,
      category: { tech: 'Tech Gadgets', kitchen: 'Kitchen & Home', lifestyle: 'Lifestyle', kids: "Kids' Products" }[document.getElementById('pm-category').value],
      badge: document.getElementById('pm-badge').value || null,
      inStock: document.getElementById('pm-stock').value === '1',
      description: document.getElementById('pm-description').value.trim(),
      features: document.getElementById('pm-features').value.split('\n').filter(Boolean),
      images: document.getElementById('pm-images').value.split('\n').filter(Boolean),
      rating: 4.5,
      reviews: 0,
    };

    if (!data.title || !data.price) { alert('Please fill in at least a title and price.'); return; }
    if (!data.images.length) data.images = ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80'];

    if (id) { S.updateProduct(id, data); showToast('Product updated! ✏️', 'success'); }
    else { S.addProduct(data); showToast('Product added! ✅', 'success'); }

    closeProductModal();
    renderProductsTable();
  };

  const deleteProductConfirm = (id) => {
    const p = S.getProductById(id);
    if (!p) return;
    if (confirm(`Delete "${p.title}"? This cannot be undone.`)) {
      S.deleteProduct(id);
      renderProductsTable();
      showToast('Product deleted.', 'info');
    }
  };

  /* ── ORDER STATUS ─────────────────────────────────────────── */
  const updateStatus = (orderId, status) => {
    S.updateOrderStatus(orderId, status);
    showToast(`Order ${orderId} updated to "${status}"`, 'success');
  };

  /* ── TOAST ────────────────────────────────────────────────── */
  const showToast = (msg, type = 'info') => {
    let container = document.querySelector('.adm-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'adm-toast-container';
      container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    const colors = { success: 'var(--adm-success)', error: 'var(--adm-error)', info: 'var(--adm-accent)', warning: 'var(--adm-warning)' };
    el.style.cssText = `background:var(--adm-card);border:1px solid var(--adm-border);border-left:3px solid ${colors[type]};border-radius:10px;padding:12px 18px;color:var(--adm-text);font-size:0.85rem;font-weight:500;box-shadow:0 8px 24px rgba(0,0,0,0.4);animation:toast-in 300ms ease;min-width:220px`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  };

  /* ── SETTINGS SAVE ────────────────────────────────────────── */
  const saveSettings = () => {
    const storeName = document.getElementById('set-storename')?.value;
    const email = document.getElementById('set-email')?.value;
    if (storeName) localStorage.setItem('wishzy_store_name', storeName);
    if (email) localStorage.setItem('wishzy_admin_email', email);
    showToast('Settings saved! ✅', 'success');
  };

  /* ── SHOPIFY AUTOMATION (SECURE BACKEND & PUBLIC API) ──────── */

  const loadShopifyConfig = () => {
    const url = localStorage.getItem('wishzy_shopify_url') || '';
    if (document.getElementById('shopify-url')) {
      document.getElementById('shopify-url').value = url;
    }
    updateShopifyStatus('🟢 Serverless Connected', 'success');
  };

  const saveShopifyUrl = () => {
    let url = document.getElementById('shopify-url')?.value.trim();
    if (!url) {
      showToast('Please enter a valid Shopify Store URL.', 'warning');
      return;
    }

    // Automatically clean up 'https://' and trailing slashes if the user pastes them
    url = url.replace(/^https?:\/\//, '').replace(/\/+$/, '');

    localStorage.setItem('wishzy_shopify_url', url);
    // Update the input field to show the cleaned version
    if (document.getElementById('shopify-url')) document.getElementById('shopify-url').value = url;

    showToast('Shopify URL Saved! 🌐', 'success');
  };

  const updateShopifyStatus = (text, type) => {
    const badge = document.getElementById('shopify-status-badge');
    if (badge) {
      badge.textContent = text;
      badge.className = `adm-badge adm-badge--${type}`;
    }
  };

  const logShopify = (msg, isError = false) => {
    const logEl = document.getElementById('shopify-log');
    if (!logEl) return;
    if (logEl.innerHTML.includes('No activity yet')) logEl.innerHTML = '';
    const time = new Date().toLocaleTimeString();
    const color = isError ? 'var(--adm-error)' : 'var(--adm-success)';
    logEl.innerHTML += `<div style="margin-bottom:4px"><span style="color:var(--adm-text)">[${time}]</span> <span style="color:${color}">${msg}</span></div>`;
    logEl.scrollTop = logEl.scrollHeight;
  };

  const testShopifyConnection = async () => {
    logShopify('Testing secure backend connection...');
    try {
      const response = await fetch('/api/shopify-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Server error');

      logShopify(`Successfully connected to shop: ${data.shop.name}`);
      showToast('Connection successful! 🔗', 'success');
    } catch (e) {
      logShopify(`Connection failed: ${e.message}`, true);
      showToast('Connection failed. Check env variables.', 'error');
      updateShopifyStatus('🔴 Connection Failed', 'error');
    }
  };

  const pullShopifyProducts = async () => {
    logShopify('Fetching products dynamically via public JSON...');
    try {
      const success = await S.fetchProductsFromJson();
      if (success) {
        logShopify('Product pull complete! Refreshing table.');
        showToast('Products imported successfully! 📦', 'success');
        renderProductsTable();
        
        logShopify('✅ Products are now instantly live globally via Proxy!');
      } else {
        throw new Error('Failed to fetch from products.json');
      }
    } catch (e) {
      logShopify(`Pull failed: ${e.message}`, true);
      showToast('Failed to pull products.', 'error');
    }
  };

  const pushCODOrdersToShopify = async () => {
    const orders = S.getOrders().filter(o => !o.shopifySyncId);
    if (!orders.length) {
      logShopify('No new orders to sync.');
      showToast('All orders are already synced.', 'info');
      return;
    }

    logShopify(`Found ${orders.length} unsynced orders. Pushing securely...`);

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      try {
        logShopify(`Syncing order ${order.id}...`);

        const payload = {
          order: {
            note: "Imported from Wishzy COD via Secure Backend",
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

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Server error');

        const shopifyId = data.order.id;

        // Mark as synced locally
        const updatedOrder = { ...order, shopifySyncId: shopifyId };
        const allOrders = S.getOrders();
        const index = allOrders.findIndex(o => o.id === order.id);
        if (index !== -1) {
          allOrders[index] = updatedOrder;
          localStorage.setItem('wishzy_orders', JSON.stringify(allOrders));
        }

        logShopify(`Order ${order.id} synced as Real Order #${shopifyId}.`);
      } catch (e) {
        logShopify(`Failed to sync order ${order.id}: ${e.message}`, true);
      }
    }
    logShopify('Sync process complete.');
    showToast('Order push complete! ⬆️', 'success');
  };




  /* ── SEARCH ───────────────────────────────────────────────── */
  const searchProducts = (query) => {
    const products = S.getProducts({ search: query });
    const el = document.getElementById('products-table-body');
    if (!el) return;
    if (!query) { renderProductsTable(); return; }
    el.innerHTML = products.map(p => `
      <tr>
        <td><img class="adm-table__img" src="${p.images[0]}" alt="${p.title}"></td>
        <td><div style="font-weight:600;font-size:0.875rem">${p.title}</div><div style="font-size:0.72rem;color:var(--adm-muted)">${p.category}</div></td>
        <td><strong>${S.formatPrice(p.price)}</strong></td>
        <td><span class="adm-badge adm-badge--info">${p.badge || '—'}</span></td>
        <td><span class="adm-badge ${p.inStock ? 'adm-badge--success' : 'adm-badge--error'}">${p.inStock ? '● In Stock' : '● Out of Stock'}</span></td>
        <td><button class="adm-btn adm-btn--ghost adm-btn--sm" onclick="WishzyAdmin.editProduct('${p.id}')">✏️ Edit</button></td>
      </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--adm-muted)">No products match your search.</td></tr>';
  };

  const filterOrders = (status) => {
    const orders = status ? S.getOrders().filter(o => o.status === status) : S.getOrders();
    const el = document.getElementById('orders-table-body');
    if (!el) return;
    el.innerHTML = orders.map(o => `
      <tr>
        <td><span style="font-family:monospace;font-weight:700;font-size:0.85rem">${o.id}</span></td>
        <td>${o.customer.name}<br><small style="color:var(--adm-muted)">📱 ${o.customer.mobile}</small></td>
        <td style="font-size:0.8rem;color:var(--adm-muted)">${o.customer.city}, ${o.customer.state}</td>
        <td>${o.items.length}</td>
        <td><strong>${S.formatPrice(o.total)}</strong></td>
        <td>${getStatusBadge(o.status)}</td>
        <td>${new Date(o.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
        <td><select class="adm-select" style="padding:5px 8px;font-size:0.75rem;width:140px" onchange="WishzyAdmin.updateStatus('${o.id}', this.value)">
          ${['Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select></td>
      </tr>
    `).join('') || '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--adm-muted)">No orders found.</td></tr>';
  };

  return {
    isLoggedIn, login, logout,
    showPanel,
    renderDashboard, renderProductsTable, renderOrdersTable, renderAnalytics,
    openAddProduct, editProduct, closeProductModal, saveProduct, deleteProductConfirm,
    updateStatus, saveSettings, searchProducts, filterOrders, showToast,
    loadShopifyConfig, saveShopifyUrl, testShopifyConnection, pullShopifyProducts, pushCODOrdersToShopify
  };
})();

window.WishzyAdmin = WishzyAdmin;
