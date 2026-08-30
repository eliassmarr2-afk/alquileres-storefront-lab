(() => {
  const DATE_KEY = 'zekere.eventDate.v1';
  const RESERVATIONS_KEY = 'zekere.reservations.v1';

  const state = {
    viewDate: startOfMonth(new Date()),
    selectedDate: readSelectedDate(),
    pendingItem: null,
    tooltipTimer: null
  };

  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function sameDay(a, b) {
    return Boolean(a && b)
      && a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  function isPast(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const candidate = new Date(date);
    candidate.setHours(0, 0, 0, 0);
    return candidate < today;
  }

  function isMockUnavailable(date) {
    if (isPast(date)) return true;
    const day = date.getDate();
    const weekday = date.getDay();
    return day % 11 === 0 || (weekday === 6 && day % 3 === 0) || (weekday === 0 && day % 4 === 0);
  }

  function toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function fromISODate(value) {
    if (!value) return null;
    const parts = value.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function readSelectedDate() {
    try {
      return fromISODate(localStorage.getItem(DATE_KEY));
    } catch (_) {
      return null;
    }
  }

  function saveSelectedDate(date) {
    state.selectedDate = date;
    try {
      localStorage.setItem(DATE_KEY, toISODate(date));
    } catch (_) {}
  }

  function clearSelectedDate() {
    state.selectedDate = null;
    try {
      localStorage.removeItem(DATE_KEY);
    } catch (_) {}
  }

  function readReservations() {
    try {
      const parsed = JSON.parse(localStorage.getItem(RESERVATIONS_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function writeReservations(items) {
    try {
      if (items.length) localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(items));
      else localStorage.removeItem(RESERVATIONS_KEY);
    } catch (_) {}
  }

  function addReservation(name, date) {
    if (!name || !date) return false;
    const dateISO = toISODate(date);
    const items = readReservations();
    const exists = items.some((item) => item && item.name === name && item.date === dateISO);
    if (exists) return false;

    items.push({ name, date: dateISO });
    writeReservations(items);
    renderReservationBanner();
    window.dispatchEvent(new CustomEvent('zekere:reservations-changed', { detail: { items } }));
    return true;
  }

  function removeReservation(name, dateISO) {
    const current = readReservations();
    const next = current.filter((item) => !(item && item.name === name && (!dateISO || item.date === dateISO)));
    if (next.length === current.length) return false;

    writeReservations(next);
    if (!next.length) clearSelectedDate();
    renderReservationBanner();
    window.dispatchEvent(new CustomEvent('zekere:reservations-changed', { detail: { items: next } }));
    return true;
  }

  function formatNormalizedDate(date) {
    if (!date) return '';
    const month = new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(date);
    return `${date.getDate()} de ${month} del ${date.getFullYear()}`;
  }

  function ensureReservationBanner() {
    let banner = document.querySelector('[data-zekere-reservation-banner]');
    if (banner) return banner;

    banner = document.createElement('a');
    banner.className = 'zekere-reservation-banner';
    banner.href = 'reservas.html';
    banner.setAttribute('data-zekere-reservation-banner', '');
    banner.hidden = true;
    banner.innerHTML = `
      <span class="zekere-reservation-banner__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="5.5" width="16" height="15" rx="2.5"></rect>
          <path d="M8 3v5M16 3v5M4 10h16"></path>
        </svg>
      </span>
      <span class="zekere-reservation-banner__copy">
        <strong data-zekere-reservation-count></strong>
        <small data-zekere-reservation-date></small>
      </span>
      <span class="zekere-reservation-banner__arrow" aria-hidden="true">›</span>
    `;

    const header = document.querySelector('.google-header, .site-header');
    if (header) header.insertAdjacentElement('afterend', banner);
    else document.body.insertBefore(banner, document.body.firstChild);
    return banner;
  }

  function renderReservationBanner() {
    const banner = ensureReservationBanner();
    const reservations = readReservations();
    const count = reservations.length;
    banner.hidden = count === 0;
    if (!count) return;

    const storedDate = fromISODate(reservations[0]?.date) || readSelectedDate();
    const countNode = banner.querySelector('[data-zekere-reservation-count]');
    const dateNode = banner.querySelector('[data-zekere-reservation-date]');
    countNode.textContent = count === 1 ? 'Tenés 1 reserva activa' : `Tenés ${count} reservas activas`;
    dateNode.textContent = storedDate ? `para el ${formatNormalizedDate(storedDate)}` : '';
  }

  function ensureTooltip() {
    let tooltip = document.querySelector('[data-zekere-reservation-tooltip]');
    if (tooltip) return tooltip;

    const tools = document.querySelector('.header-tools');
    if (!tools) return null;

    tooltip = document.createElement('div');
    tooltip.className = 'zekere-reservation-tooltip';
    tooltip.setAttribute('data-zekere-reservation-tooltip', '');
    tooltip.setAttribute('role', 'status');
    tooltip.setAttribute('aria-live', 'polite');
    tooltip.hidden = true;
    tooltip.innerHTML = `
      <span>Seleccioná la fecha del evento para reservar</span>
      <button class="zekere-reservation-tooltip__close" type="button" aria-label="Cerrar aviso" data-close-reservation-tooltip>×</button>
    `;
    tools.appendChild(tooltip);
    tooltip.querySelector('[data-close-reservation-tooltip]').addEventListener('click', hideTooltip);
    return tooltip;
  }

  function hideTooltip() {
    const tooltip = document.querySelector('[data-zekere-reservation-tooltip]');
    const trigger = document.querySelector('[data-reservation-calendar-trigger]');
    window.clearTimeout(state.tooltipTimer);
    if (tooltip) tooltip.hidden = true;
    if (trigger) trigger.classList.remove('is-attention');
  }

  function showTooltip() {
    const tooltip = ensureTooltip();
    const trigger = document.querySelector('[data-reservation-calendar-trigger]');
    if (!tooltip || !trigger) return;

    window.clearTimeout(state.tooltipTimer);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    window.setTimeout(() => {
      tooltip.hidden = false;
      trigger.classList.add('is-attention');
      state.tooltipTimer = window.setTimeout(hideTooltip, 7000);
    }, 260);
  }

  function ensureModal() {
    let modal = document.querySelector('[data-zekere-date-modal]');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.className = 'zekere-date-modal';
    modal.setAttribute('data-zekere-date-modal', '');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'zekere-date-modal-title');
    modal.hidden = true;
    modal.innerHTML = `
      <div class="zekere-date-modal__panel" data-zekere-date-panel>
        <div class="zekere-date-modal__header">
          <div>
            <h2 class="zekere-date-modal__title" id="zekere-date-modal-title">Seleccioná la fecha del evento</h2>
            <p class="zekere-date-modal__subtitle">Elegí una fecha disponible</p>
          </div>
          <button class="zekere-date-modal__close" type="button" aria-label="Cerrar calendario" data-close-date-modal>×</button>
        </div>
        <div class="zekere-calendar">
          <div class="zekere-calendar__topbar">
            <button class="zekere-calendar__nav" type="button" aria-label="Mes anterior" data-zekere-prev-month>←</button>
            <strong data-zekere-month-label></strong>
            <button class="zekere-calendar__nav" type="button" aria-label="Mes siguiente" data-zekere-next-month>→</button>
          </div>
          <div class="zekere-calendar__weekdays" aria-hidden="true">
            <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
          </div>
          <div class="zekere-calendar__grid" data-zekere-calendar-grid></div>
          <div class="zekere-calendar__legend">
            <span><i class="zekere-calendar__dot zekere-calendar__dot--available"></i>Disponible</span>
            <span><i class="zekere-calendar__dot zekere-calendar__dot--unavailable"></i>No disponible</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('[data-close-date-modal]').addEventListener('click', closeModal);
    modal.querySelector('[data-zekere-prev-month]').addEventListener('click', showPreviousMonth);
    modal.querySelector('[data-zekere-next-month]').addEventListener('click', showNextMonth);
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal();
    });
    return modal;
  }

  function openModal() {
    hideTooltip();
    const modal = ensureModal();
    state.selectedDate = readSelectedDate();
    state.viewDate = state.selectedDate ? startOfMonth(state.selectedDate) : startOfMonth(new Date());
    renderCalendar();
    modal.hidden = false;
    document.body.classList.add('has-zekere-modal');
  }

  function closeModal() {
    const modal = document.querySelector('[data-zekere-date-modal]');
    if (modal) modal.hidden = true;
    document.body.classList.remove('has-zekere-modal');
  }

  function showPreviousMonth() {
    const previous = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() - 1, 1);
    const currentMonth = startOfMonth(new Date());
    if (previous < currentMonth) return;
    state.viewDate = previous;
    renderCalendar();
  }

  function showNextMonth() {
    state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, 1);
    renderCalendar();
  }

  function selectDate(date) {
    saveSelectedDate(date);

    if (state.pendingItem) {
      addReservation(state.pendingItem, date);
      state.pendingItem = null;
    }

    renderCalendar();
    closeModal();
    renderReservationBanner();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.dispatchEvent(new CustomEvent('zekere:date-selected', {
      detail: { date: toISODate(date) }
    }));
  }

  function renderCalendar() {
    const modal = ensureModal();
    const label = modal.querySelector('[data-zekere-month-label]');
    const grid = modal.querySelector('[data-zekere-calendar-grid]');
    const prev = modal.querySelector('[data-zekere-prev-month]');
    const year = state.viewDate.getFullYear();
    const month = state.viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const mondayBasedOffset = (firstDay.getDay() + 6) % 7;
    const currentMonth = startOfMonth(new Date());

    label.textContent = new Intl.DateTimeFormat('es-AR', {
      month: 'long',
      year: 'numeric'
    }).format(firstDay);

    prev.disabled = state.viewDate <= currentMonth;
    grid.innerHTML = '';

    for (let i = 0; i < mondayBasedOffset; i += 1) {
      const spacer = document.createElement('span');
      spacer.className = 'zekere-calendar-day is-outside';
      spacer.setAttribute('aria-hidden', 'true');
      grid.appendChild(spacer);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const disabled = isMockUnavailable(date);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'zekere-calendar-day';
      button.textContent = String(day);
      button.setAttribute('aria-label', `${formatLongDate(date)}${disabled ? ', no disponible' : ', disponible'}`);

      if (disabled) {
        button.disabled = true;
        button.classList.add('is-disabled');
      } else {
        button.addEventListener('click', () => selectDate(date));
      }

      if (sameDay(date, new Date())) button.classList.add('is-today');
      if (sameDay(date, state.selectedDate)) button.classList.add('is-selected');
      grid.appendChild(button);
    }
  }

  function formatLongDate(date) {
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(date);
  }

  function handleAddReservation(button) {
    const item = button.dataset.reservationItem || 'Juego Zekere';
    state.selectedDate = readSelectedDate();

    if (state.selectedDate) {
      addReservation(item, state.selectedDate);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    state.pendingItem = item;
    showTooltip();
  }

  document.querySelectorAll('[data-add-reservation]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleAddReservation(button);
    });
  });

  document.querySelectorAll('[data-reservation-calendar-trigger]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openModal();
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideTooltip();
      closeModal();
    }
  });

  window.addEventListener('storage', (event) => {
    if (event.key === DATE_KEY) state.selectedDate = readSelectedDate();
    if (event.key === RESERVATIONS_KEY) renderReservationBanner();
  });

  window.ZekereReservations = {
    openCalendar: openModal,
    getDate: () => readSelectedDate(),
    getReservations: () => readReservations(),
    removeReservation,
    formatDate: (value) => {
      const parsed = value instanceof Date ? value : fromISODate(String(value));
      return parsed ? formatNormalizedDate(parsed) : '';
    },
    setDate: (date) => {
      const parsed = date instanceof Date ? date : fromISODate(String(date));
      if (!parsed) return;
      saveSelectedDate(parsed);
      renderReservationBanner();
    },
    refreshBanner: renderReservationBanner
  };

  ensureModal();
  ensureTooltip();
  renderReservationBanner();
})();
