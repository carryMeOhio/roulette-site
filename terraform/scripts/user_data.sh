#!/bin/bash
# Bootstrap script — runs once as root when the EC2 instance first starts.
# Installs all system dependencies, sets up PostgreSQL, writes the .env,
# and configures Nginx.  The app itself is deployed later via scripts/deploy.sh.
#
# Check progress: sudo cat /var/log/user_data.log

set -euo pipefail
exec > >(tee /var/log/user_data.log | logger -t user-data -s 2>/dev/console) 2>&1

# ── Injected by Terraform templatefile ────────────────────────────────────────
APP_NAME="${app_name}"
AWS_REGION="${aws_region}"
# ──────────────────────────────────────────────────────────────────────────────

APP_DIR="/home/ubuntu/app"

echo "=== [1/8] Updating system packages ==="
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

echo "=== [2/8] Installing system dependencies ==="
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  curl git unzip jq \
  nginx certbot python3-certbot-nginx \
  postgresql postgresql-contrib

echo "=== [3/8] Installing Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "=== [4/8] Installing PM2 ==="
npm install -g pm2

echo "=== [5/8] Installing AWS CLI v2 (ARM64) ==="
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o /tmp/awscliv2.zip
unzip -q /tmp/awscliv2.zip -d /tmp/awsinstall
/tmp/awsinstall/aws/install
rm -rf /tmp/awscliv2.zip /tmp/awsinstall

echo "=== [6/8] Fetching secrets from SSM Parameter Store ==="
# The EC2 IAM role grants GetParameter access — no credentials needed
DOMAIN=$(aws ssm get-parameter \
  --name "/$APP_NAME/domain" \
  --region "$AWS_REGION" \
  --query "Parameter.Value" \
  --output text)

DB_PASSWORD=$(aws ssm get-parameter \
  --name "/$APP_NAME/db-password" \
  --with-decryption \
  --region "$AWS_REGION" \
  --query "Parameter.Value" \
  --output text)

SESSION_SECRET=$(aws ssm get-parameter \
  --name "/$APP_NAME/session-secret" \
  --with-decryption \
  --region "$AWS_REGION" \
  --query "Parameter.Value" \
  --output text)

ADMIN_PASSWORD=$(aws ssm get-parameter \
  --name "/$APP_NAME/admin-password" \
  --with-decryption \
  --region "$AWS_REGION" \
  --query "Parameter.Value" \
  --output text)

echo "=== [7/8] Configuring PostgreSQL ==="
systemctl enable postgresql
systemctl start postgresql

# Write SQL to a temp file — avoids subshell quoting issues with special chars in password.
# Note: avoid single-quote (') characters in db_password.
cat > /tmp/setup_db.sql <<SQLEOF
CREATE USER roulette WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE roulette OWNER roulette;
GRANT ALL PRIVILEGES ON DATABASE roulette TO roulette;
SQLEOF
sudo -u postgres psql -f /tmp/setup_db.sql
rm /tmp/setup_db.sql

# Create app directory, owned by ubuntu
mkdir -p "$APP_DIR"
chown ubuntu:ubuntu "$APP_DIR"

# Write .env outside the repo — deploy.sh copies it to APP_DIR/.env.local
# Note: avoid URL-special chars (@, /, ?, #) in db_password so the DATABASE_URL stays valid.
cat > /home/ubuntu/.env.production <<ENVEOF
NODE_ENV=production
DATABASE_URL=postgresql://roulette:$DB_PASSWORD@localhost:5432/roulette
SESSION_SECRET=$SESSION_SECRET
ADMIN_PASSWORD=$ADMIN_PASSWORD
ENVEOF
chmod 600 /home/ubuntu/.env.production
chown ubuntu:ubuntu /home/ubuntu/.env.production

echo "=== [8/8] Configuring Nginx ==="
# Unquoted heredoc: $DOMAIN (bash var) expands; nginx \$vars are escaped so bash
# leaves them as literal $var in the resulting nginx config file.
cat > /etc/nginx/sites-available/roulette <<NGINX
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Next.js app running on localhost:3000 via PM2
    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/roulette /etc/nginx/sites-enabled/roulette
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "=== Registering PM2 startup service ==="
# When run as root with explicit systemd target, PM2 writes the unit file directly.
/usr/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu || true

echo ""
echo "======================================================"
echo " Bootstrap complete!"
echo "======================================================"
echo ""
echo " Elastic IP (set DNS A record here):"
echo "   $(curl -sf http://169.254.169.254/latest/meta-data/public-ipv4 || echo '<check terraform output>')"
echo ""
echo " Next steps:"
echo "   ssh ubuntu@<elastic-ip>"
echo "   git clone <repo-url> $APP_DIR"
echo "   cd $APP_DIR && bash scripts/deploy.sh"
echo ""
echo " After DNS propagates:"
echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "======================================================"
