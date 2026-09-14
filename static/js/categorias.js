(function () {
  function setupCategoryNavigation() {
    const links = document.querySelectorAll('.categorias a');
    const grid = document.querySelector('.product-grid');
    const nav = document.querySelector('.categorias');

    if (!links.length || !grid || !nav) return;

    // Limpa o mecanismo antigo de restauração de scroll.
    sessionStorage.removeItem('catalogScrollPosition');

    links.forEach((link) => {
      link.addEventListener('click', async (event) => {
        event.preventDefault();

        const url = link.href;

        try {
          const response = await fetch(url, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
          });

          if (!response.ok) throw new Error('Não foi possível carregar a categoria.');

          const html = await response.text();
          const documentHtml = new DOMParser().parseFromString(html, 'text/html');
          const newGrid = documentHtml.querySelector('.product-grid');

          if (!newGrid) throw new Error('Produtos não encontrados.');

          grid.innerHTML = newGrid.innerHTML;

          links.forEach((item) => item.classList.remove('active'));
          link.classList.add('active');

          history.pushState({}, '', url);

          // Reativa os botões "Adicionar" dos produtos que acabaram de entrar no DOM.
          document.dispatchEvent(new Event('DOMContentLoaded'));

          nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) {
          // Se o AJAX falhar, mantém o comportamento normal do link.
          window.location.href = url;
        }
      });
    });

    window.addEventListener('popstate', async () => {
      try {
        const response = await fetch(window.location.href);
        if (!response.ok) return;

        const html = await response.text();
        const documentHtml = new DOMParser().parseFromString(html, 'text/html');
        const newGrid = documentHtml.querySelector('.product-grid');
        if (!newGrid) return;

        grid.innerHTML = newGrid.innerHTML;
        document.dispatchEvent(new Event('DOMContentLoaded'));
        nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (error) {
        window.location.reload();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', setupCategoryNavigation);
})();
