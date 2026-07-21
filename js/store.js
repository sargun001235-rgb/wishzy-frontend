/* ============================================================
   WISHZY — Core Store Engine
   Products, Cart, Orders, Wishlist — localStorage persistence
   ============================================================ */

const WishzyStore = (() => {

  /* ── PRODUCT DATA ─────────────────────────────────────────── */
  const DEFAULT_PRODUCTS = [
    {
      id: 'p001',
      title: 'Rotating Makeup Organizer with LED Mirror',
      category: 'Lifestyle',
      categorySlug: 'lifestyle',
      price: 1299,
      originalPrice: 2499,
      images: [
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80',
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80'
      ],
      badge: 'hot',
      rating: 4.8,
      reviews: 2341,
      inStock: true,
      description: 'The ultimate 360° rotating makeup organizer featuring a built-in LED illuminated mirror. Perfect for vanity tables with 20+ compartments for all your beauty essentials.',
      features: ['360° Rotation', 'LED Mirror', '20+ Compartments', 'Easy Assembly']
    },
    {
      id: 'p002',
      title: 'Smart Electric Egg Cooker & Steamer',
      category: 'Kitchen & Home',
      categorySlug: 'kitchen',
      price: 899,
      originalPrice: 1799,
      images: [
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
        'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=600&q=80'
      ],
      badge: 'trending',
      rating: 4.6,
      reviews: 1876,
      inStock: true,
      description: 'Cook up to 7 eggs simultaneously to your perfect consistency — soft, medium, or hard-boiled. Auto shut-off safety feature included.',
      features: ['7-Egg Capacity', 'Auto Shut-off', 'BPA Free', 'Dishwasher Safe']
    },
    {
      id: 'p003',
      title: 'Kids Gravity Maze Building Blocks Set',
      category: "Kids' Products",
      categorySlug: 'kids',
      price: 1599,
      originalPrice: 2999,
      images: [
        'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600&q=80',
        'https://images.unsplash.com/photo-1618355776464-8666794d2520?w=600&q=80'
      ],
      badge: 'new',
      rating: 4.9,
      reviews: 987,
      inStock: true,
      description: 'Award-winning STEM building set with 150+ vibrant pieces. Develops logical thinking, creativity and problem-solving skills for kids aged 4–12.',
      features: ['150+ Pieces', 'STEM Certified', 'Ages 4–12', 'Non-Toxic']
    },
    {
      id: 'p004',
      title: 'Mini Wireless Bluetooth Keyboard',
      category: 'Tech Gadgets',
      categorySlug: 'tech',
      price: 1199,
      originalPrice: 2199,
      images: [
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
        'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=600&q=80'
      ],
      badge: 'hot',
      rating: 4.5,
      reviews: 3201,
      inStock: true,
      description: 'Ultra-slim backlit Bluetooth keyboard compatible with all devices. 3-device multi-connect, 2000mAh battery, silent keystrokes.',
      features: ['3-Device Connect', 'Backlit Keys', '2000mAh Battery', 'Silent Typing']
    },
    {
      id: 'p005',
      title: 'Portable Electric Foot Massager',
      category: 'Lifestyle',
      categorySlug: 'lifestyle',
      price: 2199,
      originalPrice: 3999,
      images: [
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80',
        'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&q=80'
      ],
      badge: 'sale',
      rating: 4.7,
      reviews: 1543,
      inStock: true,
      description: 'Deep-kneading shiatsu foot massager with heat therapy and adjustable intensity modes. Relieve tired feet after long days.',
      features: ['Heat Therapy', '5 Intensity Modes', 'Auto Shut-off', 'Foldable']
    },
    {
      id: 'p006',
      title: 'Stainless Steel Vegetable Chopper Pro',
      category: 'Kitchen & Home',
      categorySlug: 'kitchen',
      price: 799,
      originalPrice: 1499,
      images: [
        'https://images.unsplash.com/photo-1609167830220-7164aa360951?w=600&q=80',
        'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80'
      ],
      badge: 'trending',
      rating: 4.4,
      reviews: 4521,
      inStock: true,
      description: 'Multi-functional vegetable chopper with 8 interchangeable blades. Chop, slice, dice, and julienne in seconds. Compact and easy to clean.',
      features: ['8 Blade Types', 'Dishwasher Safe', 'Large Container', 'Non-slip Base']
    },
    {
      id: 'p007',
      title: 'Kids LED Drawing Tablet Glow Pad',
      category: "Kids' Products",
      categorySlug: 'kids',
      price: 699,
      originalPrice: 1399,
      images: [
        'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80',
        'https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?w=600&q=80'
      ],
      badge: 'new',
      rating: 4.8,
      reviews: 2109,
      inStock: true,
      description: 'Magical light-up drawing board that lets kids trace and create colorful artwork with special LED light stylus pens. No mess, endless creativity!',
      features: ['LED Light Effect', '4 Color Pens', 'A4 Size Board', 'Ages 3+']
    },
    {
      id: 'p008',
      title: 'Smart RGB Desk Lamp with Phone Charger',
      category: 'Tech Gadgets',
      categorySlug: 'tech',
      price: 1499,
      originalPrice: 2799,
      images: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80'
      ],
      badge: 'hot',
      rating: 4.6,
      reviews: 889,
      inStock: true,
      description: 'Adjustable RGB desk lamp with 10 brightness levels and built-in 15W wireless phone charger. Touch control with USB port for extra devices.',
      features: ['RGB 16M Colors', '15W Wireless Charge', 'Touch Control', 'USB Port']
    },
    {
      id: 'p009',
      title: 'Silicone Air Fryer Liner Set (5 Pcs)',
      category: 'Kitchen & Home',
      categorySlug: 'kitchen',
      price: 499,
      originalPrice: 999,
      images: [
        'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80',
        'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&q=80'
      ],
      badge: 'sale',
      rating: 4.5,
      reviews: 6782,
      inStock: true,
      description: 'Set of 5 non-stick silicone liners for all sizes of air fryers. Food-grade silicone, reusable, dishwasher-safe. Say goodbye to messy cleanups.',
      features: ['Food-Grade Silicone', 'Reusable', '5 Sizes Included', 'Heat-Resistant']
    },
    {
      id: 'p010',
      title: 'Baby Sensory Soft Activity Gym Mat',
      category: "Kids' Products",
      categorySlug: 'kids',
      price: 1899,
      originalPrice: 3499,
      images: [
        'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&q=80',
        'https://images.unsplash.com/photo-1590086782957-93c06ef21604?w=600&q=80'
      ],
      badge: 'new',
      rating: 4.9,
      reviews: 1234,
      inStock: true,
      description: 'Premium padded play mat with 15 removable hanging toys, mirror, crinkle papers, and teethers. Stimulates 5 senses for newborns to 12 months.',
      features: ['15 Hanging Toys', 'Padded & Washable', 'Safe Dyes', 'Newborn – 12mo']
    },
    {
      id: 'p011',
      title: 'Magnetic Phone Car Mount with 360° Arm',
      category: 'Tech Gadgets',
      categorySlug: 'tech',
      price: 599,
      originalPrice: 1299,
      images: [
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80'
      ],
      badge: 'trending',
      rating: 4.3,
      reviews: 5431,
      inStock: true,
      description: 'Strong N52 magnet car mount with flexible arm and dashboard/vent mount options. Compatible with all smartphones, includes 4 metal plates.',
      features: ['N52 Magnet', '360° Rotation', 'Universal Fit', '4 Metal Plates']
    },
    {
      id: 'p012',
      title: 'Aromatherapy Essential Oil Diffuser',
      category: 'Lifestyle',
      categorySlug: 'lifestyle',
      price: 1099,
      originalPrice: 1999,
      images: [
        'https://images.unsplash.com/photo-1626618012641-bfbca5a31239?w=600&q=80',
        'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=80'
      ],
      badge: 'hot',
      rating: 4.7,
      reviews: 3087,
      inStock: true,
      description: '500ml ultrasonic aroma diffuser with 7-color LED ambient light, auto shut-off, and whisper-quiet operation. Transforms any room into a spa.',
      features: ['500ml Capacity', '7-Color LED', 'Whisper Quiet', 'Auto Shut-off']
    }
  ];

  /* ── STORAGE HELPERS ──────────────────────────────────────── */
  const LS = {
    get: (key, fallback = null) => {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch { } },
  };

  /* Initialize products if not already stored */
  if (!LS.get('wishzy_products')) LS.set('wishzy_products', []); // Init empty instead of DEFAULT_PRODUCTS
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
      // IMMEDIATELY fall back to loading products from the local data/products.json file
      try {
        console.log('Falling back to local data/products.json...');
        const fallbackRes = await fetch('data/products.json');
        if (!fallbackRes.ok) throw new Error(`HTTP error! status: ${fallbackRes.status}`);
        
        const fallbackData = await fallbackRes.json();
        const validProducts = Array.isArray(fallbackData) ? fallbackData : (fallbackData.products || []);
        
        if (validProducts && validProducts.length > 0) {
          LS.set('wishzy_products', validProducts);
          return true; // We successfully loaded fallback products
        } else {
          throw new Error('Fallback JSON is empty or invalid format');
        }
      } catch (fallbackErr) {
        console.error('Fallback fetch also failed:', fallbackErr);
      }
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
    else { cart.push({ productId, qty, price: product.price, title: product.title, image: product.images[0], category: product.category }); }
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
document.addEventListener('DOMContentLoaded', async () => {
  let cachedProducts = WishzyStore.getProducts();
  
  if (!cachedProducts || cachedProducts.length === 0) {
    // 1. Show skeleton UI on initial load if no cache
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
    
    // 2. Await the proxy API response (which includes 3s timeout fallback)
    const success = await WishzyStore.fetchProducts();
    if (success && window.renderProducts) {
      // 3. Render directly after the fetch successfully resolves
      window.renderProducts();
    }
  } else {
    // If cached products exist, render them immediately
    if (window.renderProducts) window.renderProducts();
    
    // Then async update in background
    WishzyStore.fetchProducts().then(success => {
      if (success && window.renderProducts) {
        window.renderProducts();
      }
    });
  }
});
