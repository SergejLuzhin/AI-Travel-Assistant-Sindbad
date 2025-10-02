# Синдбад. Инструция по запуску

---

## 🚀 Установка и запуск

### 1. Клонирование репозитория

```bash
git clone https://github.com/SergejLuzhin/AI-Travel-Assistant-Sindbad.git
```

### 2. Настройка окружения

Скопируйте файл `.env.example` в `.env` и вставьте ключ OpenAI API:

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```
OPENAI_API_KEY=sk-ваш-ключ-от-OpenAI
```

### 3. Запуск в режиме разработки (hot-reload)

```bash
make dev
```

Приложение будет доступно по адресу:
👉 [http://localhost:8000](http://localhost:8000)

Изменения в коде Python подхватываются автоматически (hot reload).
Изменения в `static/` (HTML/JS/CSS) видны после обновления страницы в браузере.

### 4. Запуск в режиме продакшена (стабильный)

```bash
make prod
```

Приложение поднимется в фоне и будет работать как готовый сервис.

### 5. Запуск с подключенным туннелем Cloudflare для внешнего доступа

Запуск

```bash
make tunnel-up
```

Просмотр логов для поиска адреса 

```bash
make tunnel-logs
```

### 6. Проверка работы

```bash
make test
```

Ожидаемый ответ:

```json
{
  "status": "ok"
}
```

---

## 🛠️ Makefile команды

Мы используем `Makefile`, чтобы не писать длинные команды Docker вручную.
Ниже список доступных команд:

### 🔹 Разработка (dev)

* `make dev`
  ⇢ заменяет `docker compose -f docker-compose.dev.yml up --build`
  Запускает контейнер с hot-reload и маунтом кода.

* `make dev-up`
  ⇢ заменяет `docker compose -f docker-compose.dev.yml up -d`
  Запускает контейнер в фоне.

* `make dev-down`
  ⇢ заменяет `docker compose -f docker-compose.dev.yml down`
  Останавливает и удаляет dev-контейнер.

* `make dev-logs`
  ⇢ заменяет `docker compose -f docker-compose.dev.yml logs -f`
  Показывает логи dev-контейнера.

### 🔹 Продакшен (prod)

* `make prod`
  ⇢ заменяет `docker compose -f docker-compose.yml up --build -d`
  Собирает образ и запускает контейнер в фоне.

* `make prod-down`
  ⇢ заменяет `docker compose -f docker-compose.yml down`
  Останавливает и удаляет prod-контейнер.

* `make prod-logs`
  ⇢ заменяет `docker compose -f docker-compose.yml logs -f`
  Показывает логи prod-контейнера.

### 🔹 Проверка

* `make test`
  ⇢ делает `curl http://localhost:8000/health`
  Быстрая проверка, что сервис отвечает.

---

## ⚡ Полезные ссылки

* API документация Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)
* Healthcheck: [http://localhost:8000/health](http://localhost:8000/health)
* Главная страница (форма ввода): [http://localhost:8000/](http://localhost:8000/)

---

## 📌 Итог

* Для разработки: `make dev`
* Для продакшена: `make prod`
* Для проверки: `make test`

Никакой ручной установки Python и пакетов — всё работает через Docker.
