(function () {
  function carregarProdutos(url, atualizarHistorico = true) {
    const grid = document.querySelector('.product-grid');
    if (!grid) return Promise.resolve();

    const scrollPosition = window.scrollY;

    return fetch(url, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then((response) => {
        if (!response.ok) throw new Error('Não foi possível carregar os produtos.');
        return response.text();
      })
      .then((html) => {
        const documentHtml = new DOMParser().parseFromString(html, 'text/html');
        const newGrid = documentHtml.querySelector('.product-grid');

        if (!newGrid) throw new Error('Produtos não encontrados.');

        // Troca somente os produtos e mantém exatamente a posição da página.
        grid.innerHTML = newGrid.innerHTML;
        window.scrollTo(0, scrollPosition);

        if (atualizarHistorico) {
          history.pushState({}, '', url);
        }

        const targetUrl = new URL(url, window.location.href);
        const categoria = targetUrl.searchParams.get('cat') || 'Todos';

        document.querySelectorAll('.categorias a').forEach((link) => {
          const linkCategoria = new URL(link.href, window.location.href).searchParams.get('cat') || 'Todos';
          link.classList.toggle('active', linkCategoria === categoria);
        });

        // Reativa os botões dos produtos inseridos.
        document.dispatchEvent(new CustomEvent('catalog:updated'));
      });
  }

  function navegar(url) {
    carregarProdutos(url).catch(() => {
      window.location.href = url;
    });
  }

  function setupCategoryNavigation() {
    document.querySelectorAll('.categorias a').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        navegar(link.href);
      });
    });

    const form = document.querySelector('.search');

    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();

        const input = form.querySelector('input[name="q"]');
        const url = new URL(form.action || window.location.href, window.location.href);
        const busca = input ? input.value.trim() : '';

        if (busca) {
          url.searchParams.set('q', busca);
        } else {
          url.searchParams.delete('q');
        }

        navegar(url.href);
      });
    }

    window.addEventListener('popstate', () => {
      carregarProdutos(window.location.href, false).catch(() => {
        window.location.reload();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', setupCategoryNavigation);
})();
