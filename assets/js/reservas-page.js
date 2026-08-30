(() => {
  const catalog = {
    'Plaza Montessori': { color: 'pink', image: 'assets/images/zekere-hero.jpg', subtitle: 'Diversión y entretenimiento asegurado', description: 'La plaza Montessori viene con una serie de juegos didácticos y entretenimiento seguro para los niños.' },
    'Mini Cocina Creativa': { color: 'aqua', image: 'assets/images/file_0000000015bc820ebb8369bb65afbb17.png', subtitle: 'Imaginar, compartir y jugar', description: 'Una cocina infantil con accesorios grandes y seguros para inventar recetas, roles y pequeñas historias entre amigos.' },
    'Pelotero Sensorial': { color: 'blue', image: 'assets/images/file_0000000098b8820ebe0ce69040ebea52.png', subtitle: 'Movimiento, color y descubrimiento', description: 'Un espacio blando con pelotas de distintos tonos y elementos suaves para estimular movimiento, coordinación y juego libre.' },
    'Bloques Gigantes': { color: 'yellow', subtitle: 'Construir también es jugar', description: 'Piezas blandas de gran tamaño para apilar, crear recorridos y construir formas sin límites y sin golpes duros.' },
    'Circuito de Equilibrio': { color: 'lavender', subtitle: 'Una aventura a su medida', description: 'Rampas, pasos bajos y superficies acolchonadas para recorrer, trepar y desafiar el equilibrio de forma divertida.' }
  };

  const list = document.querySelector('[data-reservations-list]');
  const empty = document.querySelector('[data-reservations-empty]');
  const dateCopy = document.querySelector('[data-reservations-date-copy]');

  const imageIcon = () => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"></rect><circle cx="9" cy="10" r="2"></circle><path d="m5 17 4-4 3 3 2-2 5 3"></path></svg>';
  const shieldIcon = () => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 19 6v5c0 4.8-3 8-7 10-4-2-7-5.2-7-10V6l7-3Z"></path><path d="m9 12 2 2 4-4"></path></svg>';
  const trashIcon = () => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"></path></svg>';

  function render() {
    if (!window.ZekereReservations || !list) return;
    const reservations = window.ZekereReservations.getReservations();
    list.innerHTML = '';
    empty.hidden = reservations.length > 0;
    list.hidden = reservations.length === 0;

    if (!reservations.length) {
      dateCopy.textContent = 'Revisá los juegos que elegiste para tu evento.';
      return;
    }

    const formattedDate = window.ZekereReservations.formatDate(reservations[0].date);
    dateCopy.textContent = formattedDate ? `Reservas para el ${formattedDate}.` : 'Revisá los juegos que elegiste para tu evento.';

    reservations.forEach((reservation) => {
      const meta = catalog[reservation.name] || { color: 'blue', subtitle: 'Diversión para compartir', description: 'Una experiencia Zekere seleccionada para tu evento.' };
      const card = document.createElement('article');
      card.className = `game-card game-card--${meta.color}`;
      card.innerHTML = `
        <div class="game-card__preview">
          <span class="game-card__badge">${shieldIcon()}Juego seguro</span>
          <span class="game-card__arrow" aria-hidden="true">›</span>
          ${meta.image ? '' : `<span class="game-card__image-placeholder" aria-hidden="true">${imageIcon()}</span>`}
        </div>
        <div class="game-card__body">
          <div class="game-card__copy"><h2>${reservation.name} <span>${meta.subtitle}</span></h2><p>${meta.description}</p></div>
          <div class="game-card__actions">
            <button class="game-button reservation-remove" type="button" data-remove-reservation>${trashIcon()}Quitar de mis reservas</button>
            <a class="game-button game-button--details" href="alquiler.html#experiencia">Ver</a>
          </div>
        </div>`;

      if (meta.image) {
        const preview = card.querySelector('.game-card__preview');
        preview.style.backgroundImage = `url("${meta.image}")`;
        preview.style.backgroundSize = 'cover';
        preview.style.backgroundPosition = 'center';
        preview.style.backgroundRepeat = 'no-repeat';
      }

      card.querySelector('[data-remove-reservation]').addEventListener('click', () => {
        window.ZekereReservations.removeReservation(reservation.name, reservation.date);
        render();
      });
      list.appendChild(card);
    });
  }

  window.addEventListener('zekere:reservations-changed', render);
  render();
})();
