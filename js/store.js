/* ============================================================
   WISHZY — Core Store Engine
   Products, Cart, Orders, Wishlist — localStorage persistence
   ============================================================ */

const WishzyStore = (() => {

  /* ── PRODUCT DATA ─────────────────────────────────────────── */

  /* ── STORAGE HELPERS ──────────────────────────────────────── */
  const LS = {
    get: (key, fallback = null) => {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch { } },
  };

  /* Initialize products if not already stored */
  if (!LS.get('wishzy_products')) LS.set('wishzy_products', []);

  if (!LS.get('wishzy_cart')) LS.set('wishzy_cart', []);
  if (!LS.get('wishzy_orders')) LS.set('wishzy_orders', []);
  if (!LS.get('wishzy_wishlist')) LS.set('wishzy_wishlist', []);

  /* ── PRODUCTS ─────────────────────────────────────────────── */
  const getProducts = (filter = {}) => {
    let products = LS.get('wishzy_products', []);
    if (filter.category) products = products.filter(p => p.categorySlug === filter.category);
    if (filter.search) products = products.filter(p => p.title.toLowerCase().includes(filter.search.toLowerCase()));
    return products;
  };
  const getProductById = (id) => getProducts().find(p => p.id === id);
  const saveProducts = (products) => LS.set('wishzy_products', products);
  const addProduct = (product) => {
    const products = getProducts();
    product.id = 'p' + Date.now();
    products.unshift(product);
    saveProducts(products);
    return product;
  };
  const updateProduct = (id, changes) => {
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...changes };
    saveProducts(products);
    return products[idx];
  };
  const deleteProduct = (id) => {
    const products = getProducts().filter(p => p.id !== id);
    saveProducts(products);
  };

  /* ── SHOPIFY PUBLIC JSON SYNC ─────────────────────────────── */
  const fetchProducts = async () => {
    try {
      // Fetch directly from our serverless proxy for optimistic rendering
      let endpoint = `/api/shopify-proxy?t=${Date.now()}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(endpoint, { cache: 'no-store', signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Failed to fetch proxy products: ' + response.statusText);

      const data = await response.json();
      if (!data.products || data.products.length === 0) {
        throw new Error('Empty products array returned from proxy');
      }

      const importedProducts = data.products.map(p => {
        const variant = p.variants && p.variants[0];
        const price = variant ? parseFloat(variant.price) : 0;
        const comparePrice = variant && variant.compare_at_price ? parseFloat(variant.compare_at_price) : price;
        const images = p.images ? p.images.map(img => img.src) : [];

        return {
          id: p.id.toString(),
          variantId: variant ? variant.id.toString() : null,
          title: p.title,
          price: price,
          originalPrice: comparePrice,
          categorySlug: 'lifestyle',
          category: p.product_type || 'Lifestyle',
          badge: null,
          inStock: variant ? variant.available ?? true : true,
          description: p.body_html ? p.body_html.replace(/(<([^>]+)>)/gi, "") : p.title,
          features: [],
          images: images.length ? images : ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80'],
          rating: 4.5,
          reviews: Math.floor(Math.random() * 500)
        };
      });

      // Save directly to localStorage
      LS.set('wishzy_products', importedProducts);
      return true;
    } catch (e) {
      console.error('Live API fetch failed:', e);
      return false;
    }
  };

  /* ── CART ─────────────────────────────────────────────────── */
  const getCart = () => LS.get('wishzy_cart', []);
  const saveCart = (cart) => { LS.set('wishzy_cart', cart); dispatchCartUpdate(); };

  const addToCart = (productId, qty = 1) => {
    const product = getProductById(productId);
    if (!product || !product.inStock) return false;
    const cart = getCart();
    const existing = cart.find(i => i.productId === productId);
    if (existing) { existing.qty += qty; }
    else { cart.push({ productId, variantId: product.variantId, qty, price: product.price, title: product.title, image: product.images[0], category: product.category }); }
    saveCart(cart);
    return true;
  };
  const removeFromCart = (productId) => {
    saveCart(getCart().filter(i => i.productId !== productId));
  };
  const updateCartQty = (productId, qty) => {
    if (qty < 1) { removeFromCart(productId); return; }
    const cart = getCart();
    const item = cart.find(i => i.productId === productId);
    if (item) { item.qty = qty; saveCart(cart); }
  };
  const clearCart = () => saveCart([]);

  const getCartTotals = () => {
    const cart = getCart();
    const subtotal = cart.reduce((acc, i) => acc + i.price * i.qty, 0);
    const shipping = subtotal > 0 ? 0 : 0; // Free shipping
    const total = subtotal + shipping;
    const count = cart.reduce((acc, i) => acc + i.qty, 0);
    return { subtotal, shipping, total, count };
  };

  const dispatchCartUpdate = () => {
    window.dispatchEvent(new CustomEvent('wishzy:cartUpdate', { detail: getCartTotals() }));
  };

  /* ── WISHLIST ─────────────────────────────────────────────── */
  const getWishlist = () => LS.get('wishzy_wishlist', []);
  const toggleWishlist = (productId) => {
    const list = getWishlist();
    const idx = list.indexOf(productId);
    if (idx === -1) list.push(productId);
    else list.splice(idx, 1);
    LS.set('wishzy_wishlist', list);
    return list.includes(productId);
  };
  const isWishlisted = (productId) => getWishlist().includes(productId);
  /* ── CUSTOMER ─────────────────────────────────────────────── */
  const getLoggedInCustomer = () => LS.get('wishzy_customer', null);
  const loginCustomer = (customerData) => LS.set('wishzy_customer', customerData);
  const logoutCustomer = () => { localStorage.removeItem('wishzy_customer'); };

  /* ── ORDERS ───────────────────────────────────────────────── */
  const getOrders = () => LS.get('wishzy_orders', []);
  const getOrderById = (id) => getOrders().find(o => o.id === id);

  const placeOrder = (customerData) => {
    const cart = getCart();
    if (!cart.length) return null;
    const totals = getCartTotals();
    const order = {
      id: 'WZ-' + Date.now().toString(36).toUpperCase(),
      date: new Date().toISOString(),
      status: 'Confirmed',
      paymentMethod: 'Cash on Delivery',
      customer: customerData,
      items: [...cart],
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      total: totals.total
    };
    const orders = getOrders();
    orders.unshift(order);
    LS.set('wishzy_orders', orders);
    loginCustomer(customerData); // Automatically remember customer on this device
    clearCart();
    return order;
  };

  const updateOrderStatus = (id, status) => {
    const orders = getOrders();
    const order = orders.find(o => o.id === id);
    if (order) { order.status = status; LS.set('wishzy_orders', orders); }
  };

  /* ── FORMATTING ───────────────────────────────────────────── */
  const formatPrice = (n) => '₹' + Number(n).toLocaleString('en-IN');
  const getDiscount = (price, original) => Math.round((1 - price / original) * 100);
  const getStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    return '★'.repeat(full) + (half ? '✩' : '') + '☆'.repeat(5 - full - half);
  };

  /* ── RENDER HELPERS ───────────────────────────────────────── */
  const renderProductCard = (product, index = 0) => {
    const discount = getDiscount(product.price, product.originalPrice);
    const wishlisted = isWishlisted(product.id);
    const staggerClass = `stagger-${Math.min(index + 1, 5)}`;
    return `
      <div class="card product-card fade-up ${staggerClass}" data-product-id="${product.id}" onclick="WishzyStore.goToProduct('${product.id}')">
        <div class="product-card__img-wrap">
          <img class="product-card__img" src="${product.images[0]}" alt="${product.title}" loading="lazy">
          ${product.badge ? `<span class="product-card__badge badge--${product.badge}">${product.badge}</span>` : ''}
          <button class="product-card__wishlist ${wishlisted ? 'active' : ''}" onclick="event.stopPropagation(); WishzyStore.handleWishlist(this, '${product.id}')" aria-label="Add to wishlist">
            ${wishlisted ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="product-card__body">
          <div class="product-card__category">${product.category}</div>
          <h3 class="product-card__title">${product.title}</h3>
          <div class="product-card__rating">
            <span class="stars">${getStars(product.rating)}</span>
            <span class="rating-count">(${product.reviews.toLocaleString('en-IN')})</span>
          </div>
          <div class="product-card__price">
            <span class="price-current">${formatPrice(product.price)}</span>
            <span class="price-original">${formatPrice(product.originalPrice)}</span>
            <span class="price-discount">${discount}% off</span>
          </div>
        </div>
        <div class="product-card__footer">
          <button class="btn btn--primary btn--full" onclick="event.stopPropagation(); WishzyStore.addToCartUI('${product.id}')">
            🛒 Add to Cart
          </button>
        </div>
      </div>`;
  };

  const goToProduct = (id) => { window.location.href = `product.html?id=${id}`; };

  const addToCartUI = (id, qty = 1) => {
    const ok = addToCart(id, qty);
    if (ok) window.WishzyUI?.toast('Item added to cart! 🛒', 'success');
    else window.WishzyUI?.toast('Unable to add item.', 'error');
  };

  const handleWishlist = (btn, id) => {
    const added = toggleWishlist(id);
    btn.innerHTML = added ? '❤️' : '🤍';
    btn.classList.toggle('active', added);
    window.WishzyUI?.toast(added ? 'Added to Wishlist ❤️' : 'Removed from Wishlist', 'info');
  };

  /* Public API */
  return {
    getProducts, getProductById, addProduct, updateProduct, deleteProduct,
    getCart, addToCart, removeFromCart, updateCartQty, clearCart, getCartTotals,
    getWishlist, toggleWishlist, isWishlisted,
    getOrders, getOrderById, placeOrder, updateOrderStatus,
    getLoggedInCustomer, loginCustomer, logoutCustomer,
    fetchProducts,
    formatPrice, getDiscount, getStars,
    renderProductCard, goToProduct, addToCartUI, handleWishlist,
    dispatchCartUpdate
  };
})();

window.WishzyStore = WishzyStore;

// Auto-sync products on load for all users
// Auto-sync products on load for all users
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Show skeleton UI on initial load
  const grids = document.querySelectorAll('.product-grid');
  grids.forEach(grid => {
    grid.innerHTML = Array(4).fill().map(() => `
      <div class="card product-card skeleton fade-up" style="min-height:350px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: pulse 1.5s infinite; border-radius: 12px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.05);"></div>
    `).join('');
  });
  
  // Add keyframes if not present
  if (!document.getElementById('skeleton-styles')) {
    const style = document.createElement('style');
    style.id = 'skeleton-styles';
    style.innerHTML = `@keyframes pulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`;
    document.head.appendChild(style);
  }
  
  // 2. Await the proxy API response directly
  const success = await WishzyStore.fetchProducts();
  if (success && window.renderProducts) {
    // 3. Render directly after the fetch successfully resolves
    window.renderProducts();
  }
});
