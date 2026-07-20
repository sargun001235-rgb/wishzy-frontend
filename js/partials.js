/* ============================================================
   WISHZY — Shared Partials (Nav + Footer)
   Injected into every page on DOMContentLoaded
   ============================================================ */

const WishzyPartials = (() => {

  const NAV_HTML = `
  <nav class="nav" id="main-nav">
    <div class="container">
      <div class="nav__inner">
        <!-- Logo -->
        <a href="index.html" class="nav__logo" aria-label="Wishzy Home">
          <div class="nav__logo-mark">W</div>
          <span class="nav__logo-text">Wish<span>zy</span></span>
        </a>

        <!-- Desktop links -->
        <div class="nav__links">
          <a href="index.html" class="nav__link">Home</a>
          <a href="collections.html" class="nav__link">Collections</a>
          <a href="collections.html?cat=tech" class="nav__link">Tech</a>
          <a href="collections.html?cat=kitchen" class="nav__link">Kitchen</a>
          <a href="collections.html?cat=lifestyle" class="nav__link">Lifestyle</a>
          <a href="collections.html?cat=kids" class="nav__link">Kids</a>
        </div>

        <!-- Actions -->
        <div class="nav__actions">
          <a href="account.html" class="nav__icon-btn" aria-label="Account" title="My Account">
            👤
          </a>
          <a href="cart.html" class="nav__icon-btn" aria-label="Cart">
            🛒 <span class="nav__cart-badge" id="nav-cart-count">0</span>
          </a>
          <button class="nav__hamburger" id="hamburger" aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </div>
  </nav>

  <!-- Mobile Drawer -->
  <div class="nav__drawer" id="nav-drawer">
    <a href="index.html" class="nav__link">🏠 Home</a>
    <a href="collections.html" class="nav__link">🗂️ All Collections</a>
    <a href="collections.html?cat=tech" class="nav__link">💻 Tech Gadgets</a>
    <a href="collections.html?cat=kitchen" class="nav__link">🍳 Kitchen & Home</a>
    <a href="collections.html?cat=lifestyle" class="nav__link">✨ Lifestyle</a>
    <a href="collections.html?cat=kids" class="nav__link">🎈 Kids' Products</a>
    <a href="about.html" class="nav__link">👥 About Us</a>
    <a href="contact.html" class="nav__link">📩 Contact Us</a>
    <a href="faq.html" class="nav__link">❓ FAQ</a>
    <a href="track-order.html" class="nav__link">📦 Track Order</a>
    <a href="cart.html" class="nav__link">🛒 Cart</a>
  </div>`;

  const FOOTER_HTML = `
  <footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <!-- Brand -->
        <div>
          <div class="footer__brand-name">Wish<span>zy</span></div>
          <p class="footer__tagline">Smart Choices. Everyday Happiness.<br>Your one-stop destination for viral, trending products delivered to your doorstep — Cash on Delivery.</p>
          <div class="footer__social">
            <a href="#" class="footer__social-btn" aria-label="Instagram">📸</a>
            <a href="#" class="footer__social-btn" aria-label="Facebook">📘</a>
            <a href="#" class="footer__social-btn" aria-label="YouTube">▶️</a>
            <a href="#" class="footer__social-btn" aria-label="WhatsApp">💬</a>
          </div>
        </div>

        <!-- Shop -->
        <div>
          <div class="footer__col-title">Shop</div>
          <a href="collections.html?cat=tech" class="footer__link">Tech Gadgets</a>
          <a href="collections.html?cat=kitchen" class="footer__link">Kitchen & Home</a>
          <a href="collections.html?cat=lifestyle" class="footer__link">Lifestyle</a>
          <a href="collections.html?cat=kids" class="footer__link">Kids' Products</a>
          <a href="collections.html" class="footer__link">All Collections</a>
        </div>

        <!-- Help -->
        <div>
          <div class="footer__col-title">Help</div>
          <a href="faq.html" class="footer__link">FAQ</a>
          <a href="track-order.html" class="footer__link">Track Order</a>
          <a href="contact.html" class="footer__link">Contact Us</a>
          <a href="about.html" class="footer__link">About Us</a>
        </div>

        <!-- Legal -->
        <div>
          <div class="footer__col-title">Legal</div>
          <a href="privacy.html" class="footer__link">Privacy Policy</a>
          <a href="terms.html" class="footer__link">Terms & Conditions</a>
          <a href="return-policy.html" class="footer__link">Return Policy</a>
          <a href="shipping-policy.html" class="footer__link">Shipping Policy</a>
        </div>
      </div>

      <div class="footer__bottom">
        <span>© 2025 Wishzy. All rights reserved.</span>
        <div style="display:flex;align-items:center;gap:12px;">
          <span>Payment:</span>
          <div class="footer__payment-icons">
            <span class="payment-icon">COD</span>
            <span class="payment-icon">CASH</span>
            <span class="payment-icon">FREE SHIP</span>
          </div>
        </div>
        <span>Made with ❤️ in India</span>
      </div>
    </div>
  </footer>`;

  const inject = () => {
    // Inject nav
    const navTarget = document.getElementById('nav-placeholder');
    if (navTarget) navTarget.outerHTML = NAV_HTML;

    // Inject footer
    const footerTarget = document.getElementById('footer-placeholder');
    if (footerTarget) footerTarget.outerHTML = FOOTER_HTML;
  };

  document.addEventListener('DOMContentLoaded', inject);

  return { inject };
})();

window.WishzyPartials = WishzyPartials;
