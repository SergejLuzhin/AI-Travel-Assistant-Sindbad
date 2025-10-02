// 1) Находим форму и блок, куда выведем ответ сервера
const form = document.getElementById('tourForm');
const output = document.getElementById('description');

/* =========================
   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
   ========================= */

// Безопасно берём валюту (если не пришла — RUB)
function pickCurrency(data, fallback = 'RUB') {
  return data?.meta?.currency || data?.query?.budget?.currency || fallback;
}

// Безопасно берём таймзону города (нужно, чтобы время не «съезжало»)
function pickTimeZone(data, fallback = 'Europe/Moscow') {
  return data?.city_info?.timezone || data?.query?.date_range?.timezone || fallback;
}

// Форматируем сумму денег (0 → "бесплатно")
function formatMoney(amount, currency) {
  if (amount == null) return '—';
  if (Number(amount) === 0) return 'бесплатно';
  try {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(amount);
  } catch {
    // если вдруг пришёл редкий код валюты
    return `${amount} ${currency || ''}`.trim();
  }
}

// Красиво форматируем дату дня (например, "пятница, 03 октября")
function formatDay(isoDate, tz) {
  // Для "YYYY-MM-DD" создаём дату на полночь UTC — день недели совпадёт везде
  const d = new Date(isoDate + 'T00:00:00Z');
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long', day: '2-digit', month: 'long'
  }).format(d);
}

// Форматируем интервал времени по таймзоне города (например, "10:00–12:00")
function formatTimeRange(startISO, endISO, tz) {
  const fmt = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit', minute: '2-digit', timeZone: tz
  });
  const start = startISO ? fmt.format(new Date(startISO)) : '—';
  const end   = endISO   ? fmt.format(new Date(endISO))   : '—';
  return `${start}–${end}`;
}

// Ищем источник по названию места/активности (простое нечувствительное к регистру включение)
function findSourceForBlock(block, sources) {
  if (!Array.isArray(sources) || sources.length === 0) return null;
  const hay = `${block?.place?.name || ''} ${block?.activity || ''}`.toLowerCase();
  return sources.find(s => hay.includes((s?.title || '').toLowerCase())) || null;
}

/* =========================
   РЕНДЕР ПОЛУЧЕННОГО ПЛАНА
   ========================= */

// Показ «сырого» JSON для отладки
function renderDebugJSON(data, container, open = false) {
  const details = document.createElement('details');
  details.className = 'mt-3';
  details.open = open; // true = сразу раскрыт

  const summary = document.createElement('summary');
  summary.textContent = 'Показать JSON (отладка)';
  summary.className = 'fw-semibold';
  details.appendChild(summary);

  const pre = document.createElement('pre');
  pre.className = 'mt-2 small bg-light p-3 border rounded';
  pre.textContent = JSON.stringify(data, null, 2);
  details.appendChild(pre);

  container.appendChild(details);
}

function renderItinerary(data, container) {
  // Очищаем контейнер
  container.innerHTML = '';

  // Выставляем дефолты
  const currency = pickCurrency(data, 'RUB');
  const tz = pickTimeZone(data, 'Europe/Moscow');
  const sources = Array.isArray(data?.sources) ? data.sources : [];

  // Обёртка для всего плана
  const wrap = document.createElement('div');
  wrap.className = 'itinerary';

  // Заголовок города (не обязателен, но приятно)
  if (data?.city_info?.name) {
    const cityH2 = document.createElement('h2');
    cityH2.textContent = `План по городу: ${data.city_info.name}`;
    wrap.appendChild(cityH2);
  }

  // Проходим по дням
  (data?.plan || []).forEach((day) => {
    const daySection = document.createElement('section');
    daySection.className = 'day';

    // Заголовок дня: дата + бюджет на день (если есть)
    const dayTitle = document.createElement('h3');
    const dayDateText = day?.date ? formatDay(day.date, tz) : 'День';
    const dayBudgetText = (day?.day_budget != null)
      ? ` • бюджет: ${formatMoney(day.day_budget, currency)}`
      : '';
    dayTitle.textContent = `${dayDateText}${dayBudgetText}`;
    daySection.appendChild(dayTitle);

    // Контейнер для карточек активностей
    const list = document.createElement('div');
    list.className = 'blocks';

    // Каждая активность — отдельная карточка
    (day?.blocks || []).forEach((b, idx) => {
      const card = document.createElement('article');
      card.className = 'block-card';

      // 1. Заголовок: порядковый номер + название активности
      const h4 = document.createElement('h4');
      h4.textContent = `${idx + 1}. ${b?.activity || 'Активность'}`;
      card.appendChild(h4);

      // 2. Время
      const timeP = document.createElement('p');
      timeP.textContent = `Время: ${formatTimeRange(b?.start, b?.end, tz)}`;
      card.appendChild(timeP);

      // 3. Место
      const placeP = document.createElement('p');
      placeP.textContent = `Место: ${b?.place?.name || '—'}`;
      card.appendChild(placeP);

      // 4. Категория
      const catP = document.createElement('p');
      catP.textContent = `Категория: ${b?.place?.category || '—'}`;
      card.appendChild(catP);

      // 5. Стоимость
      const amount = b?.cost?.ticket ?? b?.cost?.amount ?? 0;
      const curr = b?.cost?.currency || currency;
      const costP = document.createElement('p');
      costP.textContent = `Стоимость: ${formatMoney(amount, curr)}`;
      card.appendChild(costP);

      // 6. Координаты + ссылка на карту (если есть)
      const lat = b?.place?.geo?.lat;
      const lng = b?.place?.geo?.lng;
      if (typeof lat === 'number' && typeof lng === 'number') {
        const coordsP = document.createElement('p');
        // Текст "Координаты: 55.12345, 37.12345"
        const coordsText = document.createTextNode(
          `Координаты: ${lat.toFixed(5)}, ${lng.toFixed(5)} `
        );
        coordsP.appendChild(coordsText);

        // Ссылка "Открыть карту" (Google Maps)
        const a = document.createElement('a');
        a.href = `https://maps.google.com/?q=${lat},${lng}`;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = '(Открыть карту)';
        coordsP.appendChild(a);

        card.appendChild(coordsP);
      }

      // 7. Источник (если находим по названию)
      const src = findSourceForBlock(b, sources);
      if (src) {
        const srcP = document.createElement('p');
        srcP.textContent = 'Источник: ';
        const link = document.createElement('a');
        link.href = src.url || '#';
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = src.title || 'сайт';
        srcP.appendChild(link);
        card.appendChild(srcP);
      }

      list.appendChild(card);
    });

    daySection.appendChild(list);
    wrap.appendChild(daySection);
  });

  // Итог по плану (если есть)
  if (data?.totals?.cost_minor != null) {
    const totalP = document.createElement('p');
    totalP.className = 'totals';
    totalP.textContent = `Итого по плану: ${formatMoney(data.totals.cost_minor, data?.totals?.currency || currency)}`;
    wrap.appendChild(totalP);
  }

  // Вставляем всё в переданный контейнер
  container.replaceChildren(wrap);
}

/* =========================
   ОТПРАВКА ФОРМЫ И ЗАПРОС
   ========================= */


form.addEventListener('submit', async (event) => {
  event.preventDefault();                 // не даём странице перезагрузиться
  output.textContent = 'Отправляю...';    // показываем статус

  // 1) Читаем значения из полей по их id
  const city = document.getElementById('cityInput').value.trim();
  const budget = Number(document.getElementById('budgetInput').value);
  const start_date = document.getElementById('startDate').value;  // формат: YYYY-MM-DD
  const end_date = document.getElementById('endDate').value;      // формат: YYYY-MM-DD
  const people = Number(document.getElementById('peopleCount').value);

  // 2) Собираем отмеченные чекбоксы "виды деятельности" (берём текст соответствующего <label>)
  const activities = Array.from(document.querySelectorAll('input[name="activities"]:checked'))
    .map(ch => {
      const label = document.querySelector(`label[for="${ch.id}"]`);
      return (label?.textContent || '').trim();
    });

  // 3) Формируем JSON-пейлоад для backend
  const payload = {
    city,
    budget,
    currency: 'RUB',
    start_date,
    end_date,
    people,
    activities
  };

  try {
    // 4) Отправляем POST-запрос на твой эндпоинт (поменяй URL при необходимости)
    const response = await fetch('/api/tours/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // 5) Обработка ошибки HTTP
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }

    // 6) Читаем JSON-ответ
    const data = await response.json();

    // 7) Рендерим красиво
    renderItinerary(data, output);

    renderDebugJSON(data, output, false); // поменяй на true, если хочешь открытым по умолчанию


    // Если нужно дебажить «как есть», раскомментируй следующую строку:
    //output.appendChild(document.createElement('pre')).textContent = JSON.stringify(data, null, 2);

  } catch (err) {
    // 8) Обработаем сетевые ошибки/таймауты и т.п.
    output.textContent = `Ошибка: ${err.message}`;
  }
});
