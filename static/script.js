// ===========================
// Найдём форму и контейнер
// ===========================
const form = document.getElementById('tourForm');
const output = document.getElementById('description');
// ✱ CHANGED: найдём кнопку по id (в HTML у неё id="generateBtn")
const btn = document.getElementById('generateBtn'); // ✱ CHANGED

// ===========================
// Вспомогательные функции
// ===========================

// Безопасно берём валюту и таймзону
const pickCurrency = (data, fb = 'RUB') =>
  data?.meta?.currency || data?.totals?.currency || data?.query?.budget?.currency || fb;

const pickTimeZone = (data, fb = 'Europe/Moscow') =>
  data?.city_info?.timezone || data?.query?.date_range?.timezone || fb;

// Формат денег (0 => "бесплатно")
function formatMoney(amount, currency) {
  if (amount == null) return '—';
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  if (n === 0) return 'бесплатно';
  try {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(n);
  } catch {
    return `${n} ${currency || ''}`.trim();
  }
}

// Формат заголовка дня (пятница, 03 октября)
function formatDay(isoDate, tz) {
  const [y, m, d] = (isoDate || '').split('-').map(Number);
  const date = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long', day: '2-digit', month: 'long', timeZone: tz
  }).format(date);
}

// Формат интервала времени
function formatTimeRange(startISO, endISO, tz) {
  const fmt = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit', minute: '2-digit', timeZone: tz
  });
  const s = startISO ? fmt.format(new Date(startISO)) : '—';
  const e = endISO ? fmt.format(new Date(endISO)) : '—';
  return `${s}–${e}`;
}

// Попытка найти источник по названию места/активности
function findSourceForBlock(block, sources) {
  if (!Array.isArray(sources) || sources.length === 0) return null;
  const hay = `${block?.place?.name || ''} ${block?.activity || ''}`.toLowerCase();
  return sources.find(s => hay.includes((s?.title || '').toLowerCase())) || null;
}

// Утилита создания элемента
function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

// ===========================
// Рендер результата
// ===========================
function renderItinerary(data, container) {
  container.innerHTML = ''; // очистим

  const currency = pickCurrency(data, 'RUB');
  const tz = pickTimeZone(data, 'Europe/Moscow');
  const sources = Array.isArray(data?.sources) ? data.sources : [];

  const wrap = el('div', 'd-grid gap-4');

  if (data?.city_info?.name) {
    const h2 = el('h2', 'h4 mb-0', `План по городу: ${data.city_info.name}`);
    wrap.appendChild(h2);
  }

  (data?.plan || []).forEach((day) => {
    const card = el('div', 'card');

    const header = el('div', 'card-header fw-semibold');
    const dateText = day?.date ? formatDay(day.date, tz) : 'День';
    const budgetText = (day?.day_budget != null)
      ? ` • бюджет: ${formatMoney(day.day_budget, currency)}`
      : '';
    header.textContent = `${dateText}${budgetText}`;
    card.appendChild(header);

    const body = el('div', 'card-body');
    const list = el('div', 'list-group');

    (day?.blocks || []).forEach((b, idx) => {
      const item = el('div', 'list-group-item');

      const title = el('div', 'd-flex justify-content-between align-items-start');
      const h5 = el('h5', 'mb-1', `${idx + 1}. ${b?.activity || 'Активность'}`);

      const category = b?.place?.category;
      if (category) {
        const badge = el('span', 'badge bg-secondary align-self-center');
        badge.textContent = category;
        title.appendChild(badge);
      }
      title.prepend(h5);
      item.appendChild(title);

      item.appendChild(el('div', 'small text-muted mb-1',
        `Время: ${formatTimeRange(b?.start, b?.end, tz)}`));

      item.appendChild(el('div', null, `Место: ${b?.place?.name || '—'}`));

      const amount = b?.cost?.ticket ?? b?.cost?.amount ?? 0;
      const curr = b?.cost?.currency || currency;
      item.appendChild(el('div', null, `Стоимость: ${formatMoney(amount, curr)}`));

      const lat = b?.place?.geo?.lat;
      const lng = b?.place?.geo?.lng;
      if (typeof lat === 'number' && typeof lng === 'number') {
        const coords = el('div', 'mt-1');
        const span = el('span', null, `Координаты: ${lat.toFixed(5)}, ${lng.toFixed(5)} `);
        const a = el('a', null, '(Открыть карту)');
        a.href = `https://maps.google.com/?q=${lat},${lng}`;
        a.target = '_blank';
        a.rel = 'noopener';
        coords.append(span, a);
        item.appendChild(coords);
      }

      const src = findSourceForBlock(b, sources);
      if (src) {
        const srcDiv = el('div', 'mt-1');
        const label = el('span', 'text-muted', 'Источник: ');
        const link = el('a', null, src.title || 'сайт');
        link.href = src.url || '#';
        link.target = '_blank';
        link.rel = 'noopener';
        srcDiv.append(label, link);
        item.appendChild(srcDiv);
      }

      list.appendChild(item);
    });

    body.appendChild(list);
    card.appendChild(body);
    wrap.appendChild(card);
  });

  if (data?.totals?.cost_minor != null) {
    const total = el('div', 'alert alert-primary mb-0 mt-n2');
    total.textContent = `Итого по плану: ${formatMoney(data.totals.cost_minor, data?.totals?.currency || currency)}`;
    wrap.appendChild(total);
  }

  if (Array.isArray(data?.sources) && data.sources.length > 0) {
    const srcCard = el('div', 'card');
    srcCard.appendChild(el('div', 'card-header fw-semibold', 'Источники'));
    const body = el('div', 'card-body');

    const ul = el('ul', 'list-unstyled mb-0');
    data.sources.forEach(s => {
      const li = el('li', 'mb-1');
      const a = el('a', null, s.title || s.url || 'источник');
      a.href = s.url || '#';
      a.target = '_blank';
      a.rel = 'noopener';
      li.appendChild(a);
      ul.appendChild(li);
    });

    body.appendChild(ul);
    srcCard.appendChild(body);
    wrap.appendChild(srcCard);
  }

  container.replaceChildren(wrap);
}

// ===========================
// Запуск генерации по КЛИКУ
// ===========================

// ✱ CHANGED: вместо перехвата submit — кликаем по кнопке
btn.addEventListener('click', async () => { // ✱ CHANGED
  // (если оставить submit-хендлер, при type="button" он просто не сработает)
  // Показать простой спиннер Bootstrap
  output.innerHTML = `
    <div class="d-flex align-items-center gap-2">
      <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
      <span>Отправляю...</span>
    </div>
  `;

  // Считываем поля
  const city = document.getElementById('cityInput').value.trim();
  const budget = Number(document.getElementById('budgetInput').value);
  const start_date = document.getElementById('startDate').value; // YYYY-MM-DD
  const end_date = document.getElementById('endDate').value;     // YYYY-MM-DD
  const people = Number(document.getElementById('peopleCount').value);

  // Активности из чекбоксов
  const activities = Array.from(document.querySelectorAll('input[name="activities"]:checked'))
    .map(ch => (document.querySelector(`label[for="${ch.id}"]`)?.textContent || '').trim());

  const payload = { city, budget, currency: 'RUB', start_date, end_date, people, activities };

  try {
    const resp = await fetch('/api/tours/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(text || `HTTP ${resp.status}`);
    }

    const data = await resp.json();
    renderItinerary(data, output); // отрисовали карточки
  } catch (err) {
    output.innerHTML = `<div class="alert alert-danger mb-0">Ошибка: ${err.message}</div>`;
  }
}); // ✱ CHANGED (конец обработчика клика)
