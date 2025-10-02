# app/routes/tours.py
import json
import logging
from datetime import date
from pathlib import Path
from typing import Sequence

from fastapi import APIRouter, HTTPException
from app.models.tour import TourRequest
from dotenv import load_dotenv
from openai import OpenAI

# 1) Логирование
logger = logging.getLogger(__name__)

# 2) Роутер для раздела "туры"
router = APIRouter(prefix="/api/tours", tags=["tours"])

# 3) Константы и инициализация OpenAI-клиента (как в твоём файле)
load_dotenv()
GPT_MODEL = "gpt-4o"
client = OpenAI()  # ключ берётся из переменной окружения OPENAI_API_KEY

# 4) Утилита чтения файла (простой и надёжный вариант)
def load_prompt(path: str) -> str:
    p = Path(path)
    try:
        text = p.read_text(encoding="utf-8").strip()
        if not text:
            raise ValueError(f"{path} is empty")
        return text
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail=f"Prompt file not found: {path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read {path}: {e}")

# 5) Сборка строки интересов в формате: 'Пляжи', 'Спа'
def build_activities_str(activities: Sequence[str]) -> str:
    return ", ".join(f"'{a}'" for a in activities) if activities else ""

# 6) Эндпоинт: принимает JSON → подставляет в шаблон → вызывает OpenAI → возвращает ЧИСТЫЙ JSON
@router.post("/generate")
async def generate_tour(req: TourRequest):
    # 6.1) Мини-проверка дат (бизнес-логика)
    if req.start_date > req.end_date:
        raise HTTPException(status_code=400, detail="start_date позже end_date")

    # 6.2) Готовим переменные для подстановки
    city: str = req.city
    start_date: date = req.start_date
    end_date: date = req.end_date
    people: int = req.people
    budget: float = req.budget
    activities_str = build_activities_str(req.activities)

    # 6.3) Подгружаем шаблоны из файлов
    # ВАЖНО: в user_prompt.txt должны быть удвоенные {{ }} для буквальных фигурных скобок,
    # а для переменных — одинарные {city}, {start_date}, {end_date}, {budget}, {people}, {activities_str}, {days_phrase}
    system_prompt = load_prompt("prompts/system_prompt.txt")
    user_prompt_template = load_prompt("prompts/user_prompt.txt")

    # 6.4) Готовим человеко-понятную фразу про длительность (её читает модель)
    trip_days = (end_date - start_date).days + 1
    days_phrase = f"на {trip_days} дней (с {start_date} по {end_date})"

    # 6.5) Формируем финальный user-промпт через .format(...)
    try:
        user_prompt = user_prompt_template.format(
            city=city,
            start_date=start_date,
            end_date=end_date,
            budget=int(budget),   # если нужны только целые рубли
            people=people,
            activities_str=activities_str,
            days_phrase=days_phrase,
        )
    except KeyError as e:
        # если в шаблоне забыли нужный плейсхолдер
        raise HTTPException(status_code=500, detail=f"Missing placeholder in user_prompt.txt: {e}")

    logger.info("Prompt prepared: city=%s days=%d people=%d", city, trip_days, people)

    # 6.6) Вызов OpenAI Responses API 
    try:
        resp = client.responses.create(
            model=GPT_MODEL,
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            tools=[{"type": "web_search"}]
        )
    except Exception as e:
        # сетевые/аутентификационные/квотные ошибки
        logger.exception("OpenAI call failed")
        raise HTTPException(status_code=502, detail=f"OpenAI error: {e}")

    # 6.7) Достаём текст ответа (SDK даёт удобное свойство output_text)
    output_text = getattr(resp, "output_text", None)
    if not output_text:
        # если модель вернула не-текстовый ответ или пусто
        raise HTTPException(status_code=502, detail="Empty response from OpenAI")

    # 6.8) Требование: вернуть ТОЛЬКО один корректный JSON-объект.
    # Парсим текст как JSON. Если не парсится — отдаём 502 и кусочек текста для отладки.
    try:
        data = json.loads(output_text)
    except json.JSONDecodeError as e:
        snippet = output_text[:400]
        logger.error("Model returned non-JSON. Snippet: %s", snippet)
        raise HTTPException(
            status_code=502,
            detail=f"Model did not return valid JSON: {e}. Snippet: {snippet}"
        )

    # 6.9) Логирирование использования токенов 
    usage = getattr(resp, "usage", None)
    input_tokens = getattr(usage, "input_tokens", 0) if usage else 0
    output_tokens = getattr(usage, "output_tokens", 0) if usage else 0
    logger.info("OpenAI usage: input=%d output=%d", input_tokens, output_tokens)

    # 6.10) Возвращаем ЧИСТЫЙ JSON-объект плана — FastAPI сам сериализует dict → JSON
    return data
