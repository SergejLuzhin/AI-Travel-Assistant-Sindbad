from datetime import date
from typing import List, Optional, Annotated
from pydantic import BaseModel, Field

# ВХОД от фронта
class TourRequest(BaseModel):
    city: Annotated[str, Field(min_length=1)]                      # строка, не пустая
    budget: Annotated[float, Field(gt=0)]                          # число > 0
    currency: Annotated[str, Field(min_length=3, max_length=3, default="RUB")]
    start_date: date                                               # ISO-дата YYYY-MM-DD
    end_date: date
    people: Annotated[int, Field(ge=1)]                            # целое ≥ 1
    activities: List[str] = []                                     # список строк (по умолчанию пустой)

# Элемент маршрута в ОТВЕТЕ
class ItineraryItem(BaseModel):
    day: Annotated[str, Field(min_length=1)]                       # название дня (строка, не пустая)
    activities: Annotated[str, Field(min_length=1)]                # описание активностей (строка, не пустая)

# ОТВЕТ серверa
class TourResponse(BaseModel):
    title: Annotated[str, Field(min_length=1)]                     # заголовок тура (обязателен)
    description: Optional[Annotated[str, Field(min_length=1)]] = None  # описание (может отсутствовать)
    itinerary: List[ItineraryItem] = []                            # список дней (по умолчанию пустой)
    estimated_cost: Optional[Annotated[float, Field(gt=0)]] = None # стоимость (опционально, если есть)
    currency: Annotated[str, Field(min_length=3, max_length=3, default="RUB")]

