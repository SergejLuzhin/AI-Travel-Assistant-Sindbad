import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.routes.tours import router as tours_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(title="Travel API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==== ВАЖНО: static лежит в КОРНЕ проекта ====
APP_DIR   = Path(__file__).resolve().parent         # .../app
ROOT_DIR  = APP_DIR.parent                          # корень проекта
STATIC_DIR = ROOT_DIR / "static"                    # ./static (в корне)
INDEX_FILE = STATIC_DIR / "index.html"

# Раздаём корневую static/ по /static
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Корень сайта — отдаём ./static/index.html
@app.get("/", include_in_schema=False)
def root_page():
    if not INDEX_FILE.exists():
        return {"error": f"index.html not found at {INDEX_FILE}"}
    return FileResponse(str(INDEX_FILE))
# =============================================

# Подключаем API
app.include_router(tours_router)

@app.get("/health", include_in_schema=False)
def health():
    return {"status": "ok"}
