# Базовый Python
FROM python:3.13-slim

# Небольшие оптимизации Python и сетки
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Рабочая директория в контейнере
WORKDIR /app

# Сначала зависимости (лучше кэшируется)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем исходники (весь проект)
COPY . .

# Открываем порт приложения
EXPOSE 8000

# Старт (прод-режим по умолчанию)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
