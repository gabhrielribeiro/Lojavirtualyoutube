(function () {
  const cartKey = 'loja-vitrine-cart';

  function readCart() {
    try {
      return JSON.parse(localStorage.getItem(cartKey)) || [];
    } catch (error) {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(cartKey, JSON.stringify(items));
    updateCartCount();
  }

  function updateCartCount() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;

    const total = readCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    badge.textContent = total;
    badge.classList.toggle('hidden', total === 0);
  }

  function showToast(message) {
    let toast = document.querySelector('[data-toast]');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.dataset.toast = '';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function addToCart(product) {
    const items = readCart();
    product.price = parsePrice(product.price);
    const key = `${product.id}-${product.size || 'sem-tamanho'}`;
    const existing = items.find((item) => item.key === key);

    if (existing) {
      existing.quantity += product.quantity;
    } else {
      items.push({ ...product, key });
    }

    saveCart(items);
  }

  function parsePrice(value) {
    if (typeof value === 'number') return value;

    const formattedValue = String(value || '').replace(/R\$/g, '').trim();
    const normalizedValue = formattedValue.includes(',')
      ? formattedValue.replace(/\./g, '').replace(',', '.')
      : formattedValue;

    return Number(normalizedValue) || 0;
  }

  function formatMoney(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parsePrice(value));
  }

  function escapeHtml(value) {
    const element = document.createElement('div');
    element.textContent = value || '';
    return element.innerHTML;
  }

  async function updateCartWithCurrentProducts() {
    const response = await fetch('/api/produtos/', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Não foi possível obter os produtos.');

    const data = await response.json();
    const products = new Map(data.produtos.map((product) => [product.id, product]));
    const items = readCart();
    let changed = false;

    const updatedItems = items.map((item) => {
      // Também converte os itens salvos pela versão anterior do carrinho.
      const productId = String(item.id || '').replaceAll('-', '_');
      const product = products.get(productId);
      if (!product) return item;

      changed = true;
      return {
        ...item,
        id: product.id,
        name: product.nome,
        price: product.preco,
        image: product.imagem,
      };
    });

    if (changed) saveCart(updatedItems);
    return updatedItems;
  }

  async function renderCart() {
    const container = document.getElementById('cart-items');
    const page = document.getElementById('cart-page');
    const empty = document.getElementById('cart-empty');
    const title = document.querySelector('.cart-title');
    if (!container || !page || !empty) return;

    let items = readCart();
    try {
      items = await updateCartWithCurrentProducts();
    } catch (error) {
      // O carrinho salvo continua disponível mesmo se a conexão falhar.
    }
    const hasItems = items.length > 0;
    page.hidden = !hasItems;
    page.style.display = hasItems ? '' : 'none';
    empty.hidden = hasItems;
    empty.style.display = hasItems ? 'none' : '';
    if (title) {
      title.hidden = !hasItems;
      title.style.display = hasItems ? '' : 'none';
    }
    if (!hasItems) return;

    container.innerHTML = items.map((item) => `
      <article class="cart-item">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
        <div class="cart-item-info">
          <h4>${escapeHtml(item.name)}</h4>
          <p class="muted">${escapeHtml(item.size ? `Tamanho: ${item.size}` : item.category)}</p>
          <p class="price">${formatMoney(item.price)}</p>
        </div>
        <div class="cart-item-actions">
          <div class="qty">
            <button type="button" data-cart-qty="-1" data-key="${escapeHtml(item.key)}" aria-label="Diminuir quantidade">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-cart-qty="1" data-key="${escapeHtml(item.key)}" aria-label="Aumentar quantidade">+</button>
          </div>
          <button type="button" class="remove" data-remove="${escapeHtml(item.key)}">Remover</button>
        </div>
      </article>`).join('');

    const subtotal = items.reduce((total, item) => total + parsePrice(item.price) * item.quantity, 0);
    document.getElementById('sum-subtotal').textContent = formatMoney(subtotal);
    document.getElementById('sum-total').textContent = formatMoney(subtotal);
  }

  function setupCartPage() {
    const container = document.getElementById('cart-items');
    if (!container) return;

    container.addEventListener('click', (event) => {
      const quantityButton = event.target.closest('[data-cart-qty]');
      const removeButton = event.target.closest('[data-remove]');
      const items = readCart();

      if (quantityButton) {
        const item = items.find((cartItem) => cartItem.key === quantityButton.dataset.key);
        if (item) {
          item.quantity += Number(quantityButton.dataset.cartQty);
          saveCart(item.quantity > 0 ? items : items.filter((cartItem) => cartItem !== item));
          void renderCart();
        }
      }

      if (removeButton) {
        saveCart(items.filter((item) => item.key !== removeButton.dataset.remove));
        void renderCart();
      }
    });

    document.getElementById('checkout-btn')?.addEventListener('click', () => {
      const items = readCart();
      if (!items.length) {
        showToast('Adicione produtos à sacola antes de finalizar.');
        return;
      }

      const cartPage = document.querySelector('[data-whatsapp]');
      const phone = cartPage?.dataset.whatsapp;
      if (!phone) {
        showToast('Defina o número do WhatsApp da loja para finalizar.');
        return;
      }

      const subtotal = items.reduce((total, item) => total + parsePrice(item.price) * item.quantity, 0);
      const orderLines = items.map((item) => {
        const size = item.size ? ` | Tamanho: ${item.size}` : '';
        return `• ${item.quantity}x ${item.name}${size} — ${formatMoney(parsePrice(item.price) * item.quantity)}`;
      });
      const message = [
        'Olá! Gostaria de finalizar este pedido:',
        '',
        ...orderLines,
        '',
        `Total: ${formatMoney(subtotal)}`,
      ].join('\n');
      window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    });

    void renderCart();
  }

  function setupProductCards() {
    document.querySelectorAll('[data-add]').forEach((button) => {
      button.addEventListener('click', () => {
        const card = button.closest('.product-card');
        if (!card) return;
        addToCart({ id: card.dataset.id, name: card.dataset.name, price: card.dataset.price, image: card.dataset.image, category: card.dataset.category, quantity: 1 });
        showToast('Produto adicionado à sacola.');
      });
    });
  }

  function setupProductPage() {
    const page = document.querySelector('.product-page');
    if (!page) return;

    const variantGroup = page.querySelector('[data-variant-group]');
    const variantButtons = Array.from(page.querySelectorAll('[data-variant]'));
    const qtyValue = page.querySelector('[data-qty-value]');
    const addButton = page.querySelector('[data-add-detail]');
    let selectedSize = '';
    let quantity = 1;

    variantButtons.forEach((button) => {
      button.addEventListener('click', () => {
        selectedSize = button.dataset.variant;
        variantGroup.classList.remove('has-error');

        variantButtons.forEach((item) => {
          const active = item === button;
          item.classList.toggle('active', active);
          item.setAttribute('aria-pressed', String(active));
        });
      });
    });

    page.querySelectorAll('[data-qty]').forEach((button) => {
      button.addEventListener('click', () => {
        quantity = Math.max(1, quantity + Number(button.dataset.qty));
        qtyValue.textContent = quantity;
      });
    });

    addButton.addEventListener('click', () => {
      if (!selectedSize) {
        variantGroup.classList.add('has-error');
        return;
      }

      addToCart({
        id: page.dataset.id,
        name: page.dataset.name,
        price: page.dataset.price,
        image: page.dataset.image,
        category: page.dataset.category,
        size: selectedSize,
        quantity,
      });

      showToast(`${quantity} item(ns) tamanho ${selectedSize} adicionados a sacola.`);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    setupProductPage();
    setupProductCards();
    setupCartPage();
  });
})();
