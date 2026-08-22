#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$DIR/docker-compose.yml"
CONTAINER_NAME="study_app_postgres"
# Load environment file if present (matching Compose's default lookup)
if [ -f "$DIR/.env" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$DIR/.env"
    set +a
elif [ -f "$DIR/../.env" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$DIR/../.env"
    set +a
fi

DB_NAME="${POSTGRES_DB:-test}"
DB_USER="${POSTGRES_USER:-postgres}"

# Determine compose command
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Neither 'docker compose' nor 'docker-compose' found in PATH."
    exit 1
fi

echo "=== [1/4] Starting PostgreSQL Docker Container ==="
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d

echo "=== [2/4] Waiting for PostgreSQL Healthcheck ==="
MAX_RETRIES=25
RETRY_COUNT=0
until [ "$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo 'unhealthy')" = "healthy" ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
        echo "❌ Timeout waiting for container to become healthy"
        $DOCKER_COMPOSE -f "$COMPOSE_FILE" logs
        exit 1
    fi
    echo "Waiting for healthcheck ($RETRY_COUNT/$MAX_RETRIES)..."
    sleep 2
done

echo "✅ Container is healthy!"

echo "=== [3/4] Running SQL Connection & Query Verification ==="
# Obtain resolved DB user and DB name directly from the container runtime
CONTAINER_USER=$(docker exec "$CONTAINER_NAME" printenv POSTGRES_USER 2>/dev/null || true)
CONTAINER_DB=$(docker exec "$CONTAINER_NAME" printenv POSTGRES_DB 2>/dev/null || true)

DB_USER="${CONTAINER_USER:-${DB_USER}}"
DB_NAME="${CONTAINER_DB:-${DB_NAME}}"

RESULT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT current_database();" | xargs)

if [ "$RESULT" = "$DB_NAME" ]; then
    echo "✅ Database connection successful! Current DB: '$RESULT' (User: '$DB_USER')"
else
    echo "❌ Unexpected database name: '$RESULT' (expected '$DB_NAME')"
    exit 1
fi

VERSION=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT version();" | head -n 1 | xargs)
echo "✅ Server version: $VERSION"

# Validate standard SQL query execution on the empty database
QUERY_TEST=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "CREATE TEMPORARY TABLE _test_ping(id serial, status text); INSERT INTO _test_ping(status) VALUES ('ok'); SELECT status FROM _test_ping;" | xargs)
if [ "$QUERY_TEST" = "ok" ]; then
    echo "✅ Query read/write execution test passed on empty database."
else
    echo "❌ Query execution test failed: '$QUERY_TEST'"
    exit 1
fi

echo "=== [4/4] Docker Environment Setup Verified Successfully ==="

if [[ "${1:-}" == "--down" || "${1:-}" == "--clean" ]]; then
    echo "Stopping and removing container..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" down
fi

