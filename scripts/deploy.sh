#!/bin/bash
# Deploy script for roulette-site on the EC2 server.
#
# Run this from the app directory after cloning the repo:
#   cd ~/app && bash scripts/deploy.sh
#
# Re-run the same command for every subsequent update (git pull is included).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
cd "$APP_DIR"

echo ""
echo "======================================================"
echo " Deploying roulette-site from $APP_DIR"
echo "======================================================"
echo ""

# ── Step 1: Pull latest code ───────────────────────────────────────────────────
echo "--- [1/7] Pulling latest code ---"
# Discard the sqlite→postgresql edit from the previous deploy (step 3 redoes it)
# so the modified tracked file can't block the pull.
git checkout -- prisma/schema.prisma 2>/dev/null || true
git pull

# ── Step 2: Copy .env ─────────────────────────────────────────────────────────
echo "--- [2/7] Copying .env.production → .env.local ---"
if [[ ! -f /home/ubuntu/.env.production ]]; then
  echo ""
  echo "ERROR: /home/ubuntu/.env.production not found."
  echo "       The EC2 bootstrap (user_data.sh) may not have completed yet."
  echo "       Check: sudo cat /var/log/user_data.log"
  echo ""
  exit 1
fi
cp /home/ubuntu/.env.production .env.local

# ── Step 3: Switch schema.prisma SQLite → PostgreSQL (idempotent) ──────────────
echo "--- [3/7] Checking Prisma schema provider ---"
if grep -q 'provider = "sqlite"' prisma/schema.prisma; then
  sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
  echo "    Switched provider to postgresql"
else
  echo "    Already postgresql — no change needed"
fi

# ── Step 4: Install dependencies ─────────────────────────────────────────────
echo "--- [4/7] Installing dependencies ---"
npm ci

# ── Step 5: Prisma generate + push schema ────────────────────────────────────
echo "--- [5/7] Running Prisma ---"
npx prisma generate
npx prisma db push

# ── Optional: Import data and fetch covers ────────────────────────────────────
# Run these MANUALLY on first deploy (after uploading your xlsx file):
#
#   Upload xlsx from your laptop:
#     scp /path/to/data.xlsx ubuntu@<elastic-ip>:~/app/
#
#   Then, on the server:
#     npm run import          # imports all seasons/albums/scores/reviews
#     npm run covers          # fetches album cover art from MusicBrainz (~1 req/sec)
#
# Do NOT add these to the automated deploy — they're one-time data migrations.

# ── Step 6: Build Next.js ─────────────────────────────────────────────────────
echo "--- [6/7] Building Next.js ---"
# On a 1 GB instance (t4g.micro) the old app process + PostgreSQL leave too little
# RAM for the build, forcing heavy swapping. Pause the app during the build to free
# ~150 MB; step 7 starts it again. This means a brief outage on each deploy — fine
# for a low-traffic archive. Harmless on first deploy (process doesn't exist yet).
pm2 stop roulette 2>/dev/null || true
npm run build

# ── Step 7: Start / restart PM2 ───────────────────────────────────────────────
echo "--- [7/7] Restarting app with PM2 ---"
if pm2 describe roulette > /dev/null 2>&1; then
  pm2 restart roulette
else
  pm2 start npm --name roulette -- start
fi

# Persist the process list so PM2 restarts it after a reboot
pm2 save

# Register PM2 with systemd (only needed once; harmless to re-run)
STARTUP_CMD=$(pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>&1 | grep "sudo env" || true)
if [[ -n "$STARTUP_CMD" ]]; then
  echo "    Registering PM2 startup hook..."
  eval "$STARTUP_CMD"
fi

echo ""
echo "======================================================"
echo " Deploy complete!"
echo " App running at http://localhost:3000 (via Nginx: port 80)"
echo ""
echo " If this is your first deploy, remember to:"
echo "   1. Point your domain A record to the Elastic IP"
echo "      (run: terraform output elastic_ip   from your laptop)"
echo "   2. After DNS propagates:"
echo "      sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
echo "======================================================"
echo ""
