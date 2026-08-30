(() => {
  document.querySelectorAll('[data-card-link]').forEach((card) => {
    const openCard = () => {
      window.location.href = card.dataset.cardLink;
    };

    card.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) return;
      openCard();
    });

    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openCard();
      }
    });
  });

  document.querySelectorAll('a[href="index.html#zonas"]').forEach((link) => {
    link.href = 'zonas.html';
  });
})();
