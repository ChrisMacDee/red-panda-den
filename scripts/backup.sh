#!/usr/bin/env bash
set -euo pipefail

# Encrypted backup: PostgreSQL dump + /data/uploads archive → BACKUP_DIR
#
# Restoring PostgreSQL:
#   gpg --decrypt backup.sql.gz.gpg | gunzip | psql "$DATABASE_URL"
#
# Restoring uploads:
#   gpg --decrypt uploads.tar.gz.gpg | tar -xz -C /

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/../infra/.env" 2>/dev/null || true

BACKUP_DIR="${BACKUP_DIR:-/data/backups}"
GPG_KEY="${BACKUP_GPG_KEY:-}"
UPLOADS_DIR="/data/uploads"
COMPOSE_FILE="$SCRIPT_DIR/../infra/docker-compose.yml"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

encrypt_or_keep() {
  local file="$1"
  if [[ -n "$GPG_KEY" ]]; then
    gpg --batch --yes --recipient "$GPG_KEY" --encrypt "$file"
    rm "$file"
    log "Encrypted: ${file}.gpg"
  else
    log "Saved (unencrypted): $file"
    log "  Set BACKUP_GPG_KEY in infra/.env to enable encryption"
  fi
}

mkdir -p "$BACKUP_DIR"

# ── PostgreSQL ────────────────────────────────────────────────────────────────
log "Dumping PostgreSQL (${POSTGRES_DB:-life_platform})..."
PG_DUMP="$BACKUP_DIR/postgres_$TIMESTAMP.sql.gz"
PG_CONTAINER=$(docker compose -f "$COMPOSE_FILE" ps -q postgres 2>/dev/null | head -1)
if [[ -z "$PG_CONTAINER" ]]; then
  log "ERROR: postgres container not running"
  exit 1
fi
docker exec "$PG_CONTAINER" \
  pg_dump -U "${POSTGRES_USER:-lifeplatform}" "${POSTGRES_DB:-life_platform}" \
  | gzip > "$PG_DUMP"
encrypt_or_keep "$PG_DUMP"

# ── Uploads ───────────────────────────────────────────────────────────────────
if [[ -d "$UPLOADS_DIR" ]]; then
  log "Archiving $UPLOADS_DIR..."
  UPLOADS_ARCHIVE="$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz"
  tar -czf "$UPLOADS_ARCHIVE" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"
  encrypt_or_keep "$UPLOADS_ARCHIVE"
fi

# ── Prune old backups (keep last 60 files ≈ 30 days at twice-daily) ──────────
# shellcheck disable=SC2012
TOTAL=$(ls -1 "$BACKUP_DIR" 2>/dev/null | wc -l)
if [[ $TOTAL -gt 60 ]]; then
  # shellcheck disable=SC2012
  ls -1t "$BACKUP_DIR" | tail -n +61 | xargs -I{} rm "$BACKUP_DIR/{}"
  log "Pruned old backups (kept newest 60 files)"
fi

log "Backup complete."
