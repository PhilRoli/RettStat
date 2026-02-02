#!/bin/bash
# RettStat Production Deployment Script
# Usage: ./scripts/deploy.sh

set -e

echo "================================"
echo "RettStat Production Deployment"
echo "================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (use sudo)"
  exit 1
fi

# Variables
DOMAIN="rettstat.at"
INSTALL_DIR="/opt/rettstat"

echo "Step 1: System Update"
echo "---------------------"
apt update && apt upgrade -y

echo ""
echo "Step 2: Installing Dependencies"
echo "--------------------------------"
apt install -y \
  curl \
  git \
  apache2-utils \
  ufw \
  fail2ban \
  unattended-upgrades

echo ""
echo "Step 3: Installing Docker"
echo "-------------------------"
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  rm get-docker.sh
  systemctl enable docker
  systemctl start docker
  echo "Docker installed successfully"
else
  echo "Docker already installed"
fi

echo ""
echo "Step 4: Configuring Firewall"
echo "-----------------------------"
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
echo "Firewall configured"

echo ""
echo "Step 5: Creating Installation Directory"
echo "----------------------------------------"
mkdir -p $INSTALL_DIR
cd $INSTALL_DIR

echo ""
echo "Step 6: Setting up Environment File"
echo "------------------------------------"
if [ ! -f .env.production ]; then
  echo "Creating .env.production from example..."
  
  # Generate random passwords
  POSTGRES_PASS=$(openssl rand -base64 32 | tr -d '\n')
  JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
  REALTIME_ENC=$(openssl rand -base64 32 | tr -d '\n')
  REALTIME_SECRET=$(openssl rand -base64 64 | tr -d '\n')
  
  cat > .env.production <<EOF
# Production Environment - Generated on $(date)
DOMAIN=$DOMAIN
ACME_EMAIL=admin@$DOMAIN

# GitHub Configuration
GITHUB_USERNAME=YOUR_GITHUB_USERNAME
GITHUB_TOKEN=YOUR_GITHUB_TOKEN

# Database
POSTGRES_PASSWORD=$POSTGRES_PASS

# JWT Secret
JWT_SECRET=$JWT_SECRET

# Supabase Keys (REPLACE THESE)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Realtime
REALTIME_ENC_KEY=$REALTIME_ENC
REALTIME_SECRET_KEY_BASE=$REALTIME_SECRET

# SMTP (Lettermint) - CONFIGURE THIS
SMTP_HOST=smtp.lettermint.co
SMTP_PORT=587
SMTP_USER=lettermint
SMTP_PASS=YOUR_LETTERMINT_API_KEY
SMTP_FROM_EMAIL=noreply@$DOMAIN

# Basic Auth
TRAEFIK_AUTH=$(htpasswd -nb admin admin123)
STUDIO_AUTH=$(htpasswd -nb admin admin123)
EOF

  echo "✓ .env.production created with random passwords"
  echo ""
  echo "⚠️  IMPORTANT: Edit .env.production and configure:"
  echo "   - GITHUB_USERNAME and GITHUB_TOKEN"
  echo "   - SMTP_PASS (Lettermint API key)"
  echo "   - TRAEFIK_AUTH and STUDIO_AUTH (change default passwords)"
  echo "   - Generate proper SUPABASE_ANON_KEY and SUPABASE_SERVICE_KEY"
  echo ""
  read -p "Press Enter after you've edited .env.production..."
else
  echo "✓ .env.production already exists"
fi

echo ""
echo "Step 6.5: Validating Environment Variables"
echo "------------------------------------------"
# Load environment variables
set -a
source .env.production
set +a

# Check required variables
REQUIRED_VARS=(
  "DOMAIN"
  "POSTGRES_PASSWORD"
  "JWT_SECRET"
  "SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_KEY"
  "GITHUB_USERNAME"
  "GITHUB_TOKEN"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo "❌ Error: The following required environment variables are not set:"
  for var in "${MISSING_VARS[@]}"; do
    echo "   - $var"
  done
  echo ""
  echo "Please edit .env.production and set all required variables."
  exit 1
fi

echo "✓ All required environment variables are set"

echo ""
echo "Step 7: Cloning Repository"
echo "--------------------------"
if [ ! -d "repo" ]; then
  read -p "Enter your GitHub repository URL: " REPO_URL
  git clone $REPO_URL repo
else
  echo "Repository already cloned"
fi

echo ""
echo "Step 8: Copying Docker Files"
echo "----------------------------"
cp repo/docker/docker-compose.prod.yml ./docker-compose.yml
cp repo/docker/kong.yml ./kong.yml
mkdir -p backups
echo "✓ Files copied"

echo ""
echo "Step 9: Creating Systemd Service"
echo "---------------------------------"
cat > /etc/systemd/system/rettstat.service <<EOF
[Unit]
Description=RettStat Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$INSTALL_DIR
EnvironmentFile=$INSTALL_DIR/.env.production
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable rettstat.service
echo "✓ Systemd service created"

echo ""
echo "Step 10: Starting Services"
echo "--------------------------"
# Docker Compose needs .env file (not .env.production)
# Create symlink or copy for docker compose to use
if [ ! -f ".env" ]; then
  echo "Creating .env symlink to .env.production"
  ln -s .env.production .env
fi
echo "✓ Using environment variables from .env.production"
docker compose up -d

echo ""
echo "================================"
echo "Deployment Complete!"
echo "================================"
echo ""
echo "Services are starting up. Check status with:"
echo "  docker compose ps"
echo ""
echo "Access your application at:"
echo "  https://$DOMAIN"
echo "  https://api.$DOMAIN"
echo "  https://studio.$DOMAIN"
echo ""
echo "⚠️  Don't forget to:"
echo "  1. Configure DNS records for $DOMAIN"
echo "  2. Run database migrations"
echo "  3. Create your first admin user"
echo ""
echo "View logs with:"
echo "  docker compose logs -f"
