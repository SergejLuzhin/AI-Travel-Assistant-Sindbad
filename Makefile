# ========================
#  DEVELOPMENT (горячая перезагрузка, маунт кода)
# ========================

# Запуск dev-контейнера с пересборкой и логами в консоль
dev:
	docker compose -f docker-compose.dev.yml up --build

# Запуск dev-контейнера в фоне (detached mode)
dev-up:
	docker compose -f docker-compose.dev.yml up -d

# Остановка и удаление dev-контейнера
dev-down:
	docker compose -f docker-compose.dev.yml down

# Просмотр логов dev-контейнера
dev-logs:
	docker compose -f docker-compose.dev.yml logs -f


# ========================
#  PRODUCTION (стабильный запуск без reload)
# ========================

# Сборка образа и запуск прод-контейнера в фоне
prod:
	docker compose -f docker-compose.yml up --build -d

# Остановка и удаление прод-контейнера
prod-down:
	docker compose -f docker-compose.yml down

# Просмотр логов прод-контейнера
prod-logs:
	docker compose -f docker-compose.yml logs -f

# ========================
#  TUNELLING (запуск контейнера с Cloudflare Tunnel для возможности внешнего доступа)
# ========================
tunnel-up:
	docker compose -f docker-compose.dev.yml -f docker-compose.tunnel.yml up -d --build

tunnel-down:
	docker compose -f docker-compose.dev.yml -f docker-compose.tunnel.yml down

tunnel-logs:
	docker logs -f cloudflared


# ========================
#  TESTS (быстрая проверка)
# ========================

# Проверка, что сервис отвечает на healthcheck (dev или prod — в зависимости от того, что запущено)
test:
	curl -s http://localhost:8000/health | jq .
