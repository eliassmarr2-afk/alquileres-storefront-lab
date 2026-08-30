(() => {
  const previewImages = [
    'assets/images/zekere-hero.jpg',
    'assets/images/file_0000000015bc820ebb8369bb65afbb17.png',
    'assets/images/file_0000000098b8820ebe0ce69040ebea52.png'
  ];

  document.querySelectorAll('[data-card-link]').forEach((card, index) => {
    const preview = card.querySelector('.game-card__preview');
    const placeholder = card.querySelector('.game-card__image-placeholder');
    const image = previewImages[index];

    if (preview && image) {
      preview.style.backgroundImage = `url("${image}")`;
      preview.style.backgroundSize = 'cover';
      preview.style.backgroundPosition = 'center';
      preview.style.backgroundRepeat = 'no-repeat';
      if (placeholder) placeholder.remove();
    }

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
