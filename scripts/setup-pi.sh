#!/usr/bin/env bash
set -euo pipefail

# Initial Raspberry Pi 5 setup for Red Panda Den.
# Run once with sudo: sudo bash scripts/setup-pi.sh
#
# After this script:
#   1. Copy infra/.env.example to infra/.env and fill in all secrets
#   2. cloudflared tunnel login
#   3. cloudflared tunnel create red-panda-den
#   4. cd infra && docker compose up -d
#   5. Log out and back in (to pick up the docker group)

log() { echo ""; echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
die() { echo "ERROR: $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run as root: sudo bash scripts/setup-pi.sh"

DEPLOY_USER="${SUDO_USER:-pi}"

# ── System updates ────────────────────────────────────────────────────────────
log "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

log "Installing dependencies..."
apt-get install -y -qq \
  curl wget git unzip gnupg ca-certificates lsb-release \
  htop ncdu tmux fail2ban ufw

# ── Docker ────────────────────────────────────────────────────────────────────
log "Installing Docker..."
if ! command -v docker &>/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi
systemctl enable --now docker
usermod -aG docker "$DEPLOY_USER"
log "Docker installed. $DEPLOY_USER added to docker group."

# ── Cloudflare Tunnel ─────────────────────────────────────────────────────────
log "Installing cloudflared..."
if ! command -v cloudflared &>/dev/null; then
  ARCH=$(dpkg --print-architecture)
  wget -q "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb" \
    -O /tmp/cloudflared.deb
  dpkg -i /tmp/cloudflared.deb
  rm /tmp/cloudflared.deb
fi

# ── Data directories ──────────────────────────────────────────────────────────
log "Creating data directories..."
mkdir -p /data/{uploads,backups}
mkdir -p /data/uploads/knowledge
mkdir -p /var/log/red-panda-den
chown -R "$DEPLOY_USER:$DEPLOY_USER" /data /var/log/red-panda-den

# ── NVMe I/O scheduler ────────────────────────────────────────────────────────
log "Configuring NVMe I/O scheduler (none = best for NVMe SSDs)..."
cat > /etc/udev/rules.d/60-nvme-scheduler.rules <<'EOF'
ACTION=="add|change", KERNEL=="nvme[0-9]n[0-9]", ATTR{queue/scheduler}="none"
EOF
udevadm trigger

# ── Firewall ──────────────────────────────────────────────────────────────────
log "Configuring UFW firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp    # Traefik HTTP (redirects to HTTPS)
ufw allow 443/tcp   # Traefik HTTPS
ufw --force enable

# ── Backup cron ───────────────────────────────────────────────────────────────
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRON_JOB="0 3,15 * * * $DEPLOY_USER bash $REPO_DIR/scripts/backup.sh >> /var/log/red-panda-den/backup.log 2>&1"
if ! grep -qF "backup.sh" /etc/crontab 2>/dev/null; then
  echo "$CRON_JOB" >> /etc/crontab
  log "Backup cron added (02:00 and 15:00 daily)"
fi

log "Setup complete!"
echo ""
echo "  Next steps:"
echo "    1. cp infra/.env.example infra/.env   # fill in all secrets"
echo "    2. cloudflared tunnel login"
echo "    3. cloudflared tunnel create red-panda-den"
echo "    4. cd infra && docker compose up -d crowdsec"
echo "    5. docker compose exec crowdsec cscli bouncers add traefik-bouncer"
echo "       # Copy the printed key into infra/.env as CROWDSEC_BOUNCER_API_KEY"
echo "    6. cd infra && docker compose up -d"
echo "    7. Log out and back in (docker group)"
echo ""
