class SiteFooter extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host { display: block; position: relative; }
        footer {
          display: flex; align-items: center; justify-content: space-between; gap: 20px;
          padding: 28px clamp(20px, 6vw, 95px);
          border-top: 1px solid rgba(225,177,99,.43);
          background: #100c0c; color: #d4c6b3;
          font: 400 14px/1.55 Inter, Arial, sans-serif;
          letter-spacing: normal; text-align: left;
        }
        img { display: block; width: 100px; height: 60px; object-fit: contain; }
        .credit { flex-shrink: 0; text-align: right; color: #ddd2c1; font-size: 13px; line-height: 1.6; }
        strong { color: #f2e7d5; }
        small { display: block; margin-top: 6px; color: #aa9680; font-size: 12px; }
        @media (max-width: 600px) {
          footer { flex-direction: column; text-align: center; }
          .credit { text-align: center; }
        }
      </style>
      <footer>
        <a href="index.html" aria-label="Dynasty of Heroes homepage"><img src="assets/avatar.png" alt="Dynasty of Heroes"></a>
        <span>Historical fantasy inspired by Myanmar's Pagan era. Fictional portrayals may differ from historical accounts.</span>
        <span class="credit">Developed by <strong>Factory of Future</strong><small>© 2026 Dynasty of Heroes</small></span>
      </footer>`;
  }
}

customElements.define('site-footer', SiteFooter);
