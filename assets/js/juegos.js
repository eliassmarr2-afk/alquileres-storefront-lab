(() => {
  const tooltip = document.querySelector('[data-reservation-tooltip]');
  const reservationAnchor = document.querySelector('[data-reservation-anchor]');
  let tooltipTimer;

  const showReservationTooltip = () => {
    if (!tooltip || !reservationAnchor) return;

    window.clearTimeout(tooltipTimer);
    tooltip.hidden = false;
    reservationAnchor.classList.add('is-attention');

    tooltipTimer = window.setTimeout(() => {
      tooltip.hidden = true;
      reservationAnchor.classList.remove('is-attention');
    }, 4200);
  };

  document.querySelectorAll('[data-add-reservation]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      showReservationTooltip();
    });
  });

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
})();
