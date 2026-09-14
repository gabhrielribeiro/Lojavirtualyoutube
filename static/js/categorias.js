(function () {
  function carregarProdutos(url, atualizarHistorico = true) {
    const grid = document.querySelector('.product-grid');
    if (!grid) return Promise.resolve();

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

        // Guarda exatamente a posição atual e altera somente os produtos.
        const scrollPosition = window.scrollY;
        grid.innerHTML = newGrid.innerHTML;
        window.scrollTo(0, scrollPosition);

        if (atualizarHistorico) {
          history.pushState({}, '', url);
        }

        // Atualiza o estado visual da categoria.
        const categoria = new URL(url, window.location.origin).searchParams.get('cat');
        document.querySelectorAll('.categorias a').forEach((link) => {
          const linkCategoria = new URL(link.href, window.location.origin).searchParams.get('cat');
          link.classList.toggle('active', linkCategoria === categoria);
        });

        // Reativa os botões dos produtos que foram inseridos.
        if (typeof setupProductCards === 'function') {
          setupProductCards();
        }
      });
  }

  function setupCategoryNavigation() {
    document.querySelectorAll('.categorias a').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        void carregarProdutos(link.href);
      });
    });

    window.addEventListener('popstate', () => {
      void carregarProdutos(window.location.href, false);
    });
  }

  document.addEventListener('DOMContentLoaded', setupCategoryNavigation);
})();
