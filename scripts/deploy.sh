#!/usr/bin/env bash
set -euo pipefail

# Rolling deploy: pull images → up → health check → Ntfy notification
# Usage:
#   bash scripts/deploy.sh           # deploy everything
#   bash scripts/deploy.sh api       # deploy a single service

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$SCRIPT_DIR/../infra"
LOG_DIR="/var/log/red-panda-den"
LOG_FILE="$LOG_DIR/deploy.log"

# Load env if present
# shellcheck disable=SC1091
source "$INFRA_DIR/.env" 2>/dev/null || true

NTFY_URL="${NTFY_BASE_URL:-https://ntfy.redpandacreations.co.uk}"
NTFY_TOPIC="${NTFY_DEPLOY_TOPIC:-red-panda-den-deploy}"
API_HEALTH_URL="${API_HEALTH_URL:-http://localhost:3001/api/health}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

notify() {
  local title="$1" body="$2" priority="${3:-default}"
  curl -s -X POST "$NTFY_URL/$NTFY_TOPIC" \
    -H "Title: $title" \
    -H "Priority: $priority" \
    -d "$body" >/dev/null 2>&1 || true
}

mkdir -p "$LOG_DIR"

TARGET="${1:-}"
log "=== Deploy started${TARGET:+ ($TARGET)} ==="

cd "$INFRA_DIR"

if [[ -n "$TARGET" ]]; then
  log "Pulling $TARGET..."
  docker compose pull "$TARGET"
  log "Starting $TARGET..."
  docker compose up -d "$TARGET"
else
  log "Pulling all images..."
  docker compose pull
  log "Starting all services..."
  docker compose up -d
fi

log "Waiting 15s for services to settle..."
sleep 15

# Health check
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$API_HEALTH_URL" 2>/dev/null || echo "000")

if [[ "$HTTP_STATUS" == "200" ]]; then
  log "Deploy succeeded (API HTTP $HTTP_STATUS)"
  notify "Deploy succeeded" "Red Panda Den deployed successfully.${TARGET:+ Updated: $TARGET.}" "default"
else
  log "Deploy warning: API returned HTTP $HTTP_STATUS"
  notify "Deploy warning" "Deploy completed but API health check returned HTTP $HTTP_STATUS. Check logs." "high"
  exit 1
fi
