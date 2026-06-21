#!/usr/bin/env bash
# Manual health check for all Red Panda Den services.
# Exits 0 if everything is healthy, 1 if any service is down.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/../infra/.env" 2>/dev/null || true

BASE="${BASE_DOMAIN:-redpandacreations.co.uk}"
FAILED=0

check() {
  local name="$1" url="$2"
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
  if [[ "$http_code" =~ ^[23] ]]; then
    printf "  \033[32m✓\033[0m %-20s %s\n" "$name" "($http_code)"
  else
    printf "  \033[31m✗\033[0m %-20s %s\n" "$name" "($http_code)"
    FAILED=1
  fi
}

echo ""
echo "── Red Panda Den ─────────────────────────────"
check "Dashboard API"       "http://localhost:3001/api/health"
check "Dashboard UI"        "http://localhost:3000"

echo ""
echo "── Ready-made apps ───────────────────────────"
check "Mealie"              "https://meals.$BASE"
check "Actual Budget"       "https://money.$BASE"
check "Vikunja"             "https://tasks.$BASE"
check "Wiki.js"             "https://wiki.$BASE"
check "Ntfy"                "https://ntfy.$BASE"

echo ""
echo "── Ops ───────────────────────────────────────"
check "Uptime Kuma"         "https://status.$BASE"
check "Dozzle"              "https://logs.$BASE"
check "Traefik"             "https://traefik.$BASE"

echo ""
echo "── Media Den (YAMS, local) ───────────────────"
check "Jellyfin"            "http://localhost:8096"
check "Sonarr"              "http://localhost:8989"
check "Radarr"              "http://localhost:7878"
check "Prowlarr"            "http://localhost:9696"
check "Jellyseerr"          "http://localhost:5055"
check "qBittorrent"         "http://localhost:8080"

echo ""
if [[ $FAILED -eq 0 ]]; then
  echo "  All services healthy."
else
  echo "  One or more services are down."
fi
echo ""
exit $FAILED
