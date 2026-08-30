(() => {
  const BASE_PRICE = 48000;
  const SECOND_DATE_PRICE = 38400;

  const state = {
    viewDate: startOfMonth(new Date()),
    firstDate: null,
    secondDate: null,
    selectingSecondDate: false,
    addons: new Map()
  };

  const monthLabel = document.querySelector('[data-month-label]');
  const calendarGrid = document.querySelector('[data-calendar-grid]');
  const calendarToggle = document.querySelector('[data-calendar-toggle]');
  const calendarShell = document.querySelector('[data-calendar-shell]');
  const dateTriggerCopy = document.querySelector('[data-date-trigger-copy]');
  const availability = document.querySelector('[data-availability]');
  const selectedDate = document.querySelector('[data-selected-date]');
  const summaryStatus = document.querySelector('[data-summary-status]');
  const total = document.querySelector('[data-total]');
  const mobileTotal = document.querySelector('[data-mobile-total]');
  const rentButtons = [document.querySelector('[data-rent]'), document.querySelector('[data-mobile-rent]')];
  const secondDateButton = document.querySelector('[data-second-date]');
  const secondDateRow = document.querySelector('[data-second-date-row]');
  const secondDateSelection = document.querySelector('[data-second-date-selection]');
  const secondDateCopy = document.querySelector('[data-second-date-copy]');
  const toast = document.querySelector('[data-toast]');
  const galleryTrack = document.querySelector('[data-gallery-track]');
  const gallerySlides = [...document.querySelectorAll('[data-gallery-slide]')];
  const galleryThumbs = [...document.querySelectorAll('[data-gallery-thumb]')];

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

  function formatMoney(value) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(value);
  }

  function formatLongDate(date) {
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(date);
  }

  function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function setCalendarOpen(open) {
    calendarShell.hidden = !open;
    calendarToggle.setAttribute('aria-expanded', String(open));
  }

  function renderCalendar() {
    const year = state.viewDate.getFullYear();
    const month = state.viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const mondayBasedOffset = (firstDay.getDay() + 6) % 7;

    monthLabel.textContent = new Intl.DateTimeFormat('es-AR', {
      month: 'long',
      year: 'numeric'
    }).format(firstDay);

    calendarGrid.innerHTML = '';

    for (let i = 0; i < mondayBasedOffset; i += 1) {
      const spacer = document.createElement('span');
      spacer.className = 'calendar-day is-outside';
      spacer.setAttribute('aria-hidden', 'true');
      calendarGrid.appendChild(spacer);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const button = document.createElement('button');
      const disabled = isMockUnavailable(date);
      const today = new Date();

      button.type = 'button';
      button.className = 'calendar-day';
      button.textContent = String(day);
      button.setAttribute('aria-label', `${formatLongDate(date)}${disabled ? ', no disponible' : ', disponible'}`);

      if (disabled) {
        button.classList.add('is-disabled');
        button.disabled = true;
      }

      if (sameDay(date, today)) button.classList.add('is-today');
      if (sameDay(date, state.firstDate)) button.classList.add('is-selected');
      if (sameDay(date, state.secondDate)) button.classList.add('is-second');

      if (!disabled) {
        button.addEventListener('click', () => selectDate(date));
      }

      calendarGrid.appendChild(button);
    }
  }

  function selectDate(date) {
    if (state.selectingSecondDate && state.firstDate) {
      if (sameDay(date, state.firstDate)) {
        showToast('La segunda fecha debe ser distinta a la primera.');
        return;
      }

      state.secondDate = date;
      state.selectingSecondDate = false;
      secondDateSelection.hidden = false;
      secondDateRow.hidden = false;
      secondDateCopy.textContent = `Segunda reserva: ${capitalize(formatLongDate(date))} · 20% OFF aplicado`;
      secondDateButton.textContent = 'Cambiar segunda fecha';
      availability.classList.add('is-available');
      availability.querySelector('span:last-child').textContent = `${capitalize(formatLongDate(date))} disponible como segunda fecha.`;
      dateTriggerCopy.textContent = `${capitalize(formatLongDate(state.firstDate))} · segunda fecha agregada`;
      setCalendarOpen(false);
    } else {
      state.firstDate = date;

      if (state.secondDate && sameDay(state.secondDate, date)) {
        state.secondDate = null;
        secondDateSelection.hidden = true;
        secondDateRow.hidden = true;
      }

      selectedDate.textContent = capitalize(formatLongDate(date));
      dateTriggerCopy.textContent = capitalize(formatLongDate(date));
      summaryStatus.textContent = 'Disponible';
      summaryStatus.classList.add('is-ready');
      availability.classList.add('is-available');
      availability.querySelector('span:last-child').textContent = `${capitalize(formatLongDate(date))} disponible para reservar.`;
      rentButtons.forEach((button) => { button.disabled = false; });
      secondDateButton.disabled = false;
      setCalendarOpen(false);
    }

    renderCalendar();
    updateTotal();
  }

  function updateTotal() {
    let currentTotal = BASE_PRICE;

    if (state.secondDate) currentTotal += SECOND_DATE_PRICE;
    state.addons.forEach((price) => { currentTotal += price; });

    total.textContent = formatMoney(currentTotal);
    mobileTotal.textContent = formatMoney(currentTotal);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2600);
  }

  function setActiveGalleryThumb(index) {
    galleryThumbs.forEach((thumb, thumbIndex) => {
      thumb.classList.toggle('is-active', thumbIndex === index);
    });
  }

  galleryThumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const index = Number(thumb.dataset.galleryThumb);
      const slide = gallerySlides[index];
      if (!slide) return;
      galleryTrack.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
      setActiveGalleryThumb(index);
    });
  });

  let galleryScrollFrame = null;
  galleryTrack.addEventListener('scroll', () => {
    if (galleryScrollFrame) return;
    galleryScrollFrame = window.requestAnimationFrame(() => {
      const slideWidth = galleryTrack.clientWidth || 1;
      const index = Math.max(0, Math.min(gallerySlides.length - 1, Math.round(galleryTrack.scrollLeft / slideWidth)));
      setActiveGalleryThumb(index);
      galleryScrollFrame = null;
    });
  }, { passive: true });

  calendarToggle.addEventListener('click', () => {
    const open = calendarToggle.getAttribute('aria-expanded') !== 'true';
    setCalendarOpen(open);
  });

  document.querySelector('[data-prev-month]').addEventListener('click', () => {
    const previous = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() - 1, 1);
    const currentMonth = startOfMonth(new Date());
    if (previous < currentMonth) return;
    state.viewDate = previous;
    renderCalendar();
  });

  document.querySelector('[data-next-month]').addEventListener('click', () => {
    state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, 1);
    renderCalendar();
  });

  secondDateButton.addEventListener('click', () => {
    if (!state.firstDate) return;
    state.selectingSecondDate = true;
    availability.classList.remove('is-available');
    availability.querySelector('span:last-child').textContent = 'Ahora elegí la segunda fecha en el calendario.';
    dateTriggerCopy.textContent = 'Elegí una segunda fecha disponible';
    setCalendarOpen(true);
    showToast('Elegí otra fecha disponible en el calendario.');
    calendarToggle.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  document.querySelector('[data-remove-second]').addEventListener('click', () => {
    state.secondDate = null;
    state.selectingSecondDate = false;
    secondDateSelection.hidden = true;
    secondDateRow.hidden = true;
    secondDateButton.textContent = 'Elegir otra fecha';
    dateTriggerCopy.textContent = state.firstDate ? capitalize(formatLongDate(state.firstDate)) : 'Elegí una fecha disponible';
    renderCalendar();
    updateTotal();
  });

  document.querySelectorAll('[data-addon]').forEach((card) => {
    const button = card.querySelector('[data-addon-toggle]');
    const name = card.dataset.name;
    const price = Number(card.dataset.price);

    button.addEventListener('click', () => {
      if (state.addons.has(name)) {
        state.addons.delete(name);
        card.classList.remove('is-added');
        button.textContent = 'Agregar';
      } else {
        state.addons.set(name, price);
        card.classList.add('is-added');
        button.textContent = 'Agregado ✓';
      }
      updateTotal();
    });
  });

  document.querySelectorAll('[data-consult]').forEach((button) => {
    button.addEventListener('click', () => {
      const context = state.firstDate
        ? `Consulta preparada para ${formatLongDate(state.firstDate)}.`
        : 'Consulta preparada. En producción esto abrirá WhatsApp con el contexto del producto.';
      showToast(context);
    });
  });

  rentButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (!state.firstDate) return;
      showToast('Demo: la fecha está lista para pasar al checkout.');
    });
  });

  setCalendarOpen(false);
  setActiveGalleryThumb(0);
  renderCalendar();
  updateTotal();
})();
