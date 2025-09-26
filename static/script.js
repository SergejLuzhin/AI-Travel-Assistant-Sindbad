// 1) Находим форму и блок, куда выведем ответ сервера
const form = document.getElementById('tourForm');
const output = document.getElementById('description');

// 2) Вешаем обработчик на отправку формы
form.addEventListener('submit', async (event) => {
  event.preventDefault();                 // не даём странице перезагрузиться
  output.textContent = 'Отправляю...';    // показываем статус

  // 3) Читаем значения из полей по их id
  const city = document.getElementById('cityInput').value.trim();
  const budget = Number(document.getElementById('budgetInput').value);
  const start_date = document.getElementById('startDate').value;  // формат: YYYY-MM-DD
  const end_date = document.getElementById('endDate').value;      // формат: YYYY-MM-DD
  const people = Number(document.getElementById('peopleCount').value);

  // 4) Собираем отмеченные чекбоксы "виды деятельности" (берём текст соответствующего <label>)
  const activities = Array.from(document.querySelectorAll('input[name="activities"]:checked'))
    .map(ch => {
      const label = document.querySelector(`label[for="${ch.id}"]`);
      return (label?.textContent || '').trim();
    });

  // 5) Формируем удобный для backend объект (JSON)
  const payload = {
    city,
    budget,         // число
    currency: 'RUB',
    start_date,     // ISO-дата (YYYY-MM-DD)
    end_date,       // ISO-дата (YYYY-MM-DD)
    people,         // число
    activities      // массив строк
  };

  try {
    // 6) Отправляем POST-запрос на backend
    //  !!!  Поменять URL ('/api/tours/generate') на свой адрес эндпоинта при необходимости
    const response = await fetch('/api/tours/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // 7) Если сервер ответил ошибкой — покажем текст ошибки
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }

    // 8) Читаем JSON-ответ сервера и показываем его на странице
    const data = await response.json();
    // Для простоты просто выведем "как есть" в виде форматированного JSON
    output.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    // 9) Обработаем сетевые ошибки/таймауты и т.п.
    output.textContent = `Ошибка: ${err.message}`;
  }
});
