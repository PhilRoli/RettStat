#!/bin/bash
# RettStat Setup Script
# One-command deployment for RettStat on Ubuntu/Debian VPS
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/YOUR_USER/rettstat/main/scripts/setup.sh | bash
#   OR
#   git clone https://github.com/YOUR_USER/rettstat.git && cd rettstat && ./scripts/setup.sh

set -e

# Script version
SCRIPT_VERSION="1.2.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration variables
INSTALL_DIR="/opt/rettstat"
REPO_URL="https://github.com/PhilRoli/rettstat.git"

# Functions
print_header() {
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}                    RettStat Setup Script${NC}"
    echo -e "${GREEN}                         v${SCRIPT_VERSION}${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${YELLOW}➜ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

prompt() {
    local var_name="$1"
    local prompt_text="$2"
    local default_value="$3"
    local input
    
    if [ -n "$default_value" ]; then
        printf "%s [%s]: " "$prompt_text" "$default_value"
        read -r input </dev/tty
        if [ -z "$input" ]; then
            input="$default_value"
        fi
    else
        printf "%s: " "$prompt_text"
        read -r input </dev/tty
    fi
    eval "$var_name=\"\$input\""
}

prompt_password() {
    local var_name="$1"
    local prompt_text="$2"
    local input
    
    printf "%s: " "$prompt_text"
    read -r -s input </dev/tty
    echo ""
    eval "$var_name=\"\$input\""
}

# Main script
print_header

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run as root. Run as normal user with sudo privileges."
    exit 1
fi

# Check if user has sudo
if ! sudo -v; then
    print_error "User does not have sudo privileges"
    exit 1
fi

print_step "Checking system requirements..."

# Check OS
if [ ! -f /etc/os-release ]; then
    print_error "Cannot determine OS. This script requires Ubuntu/Debian."
    exit 1
fi

. /etc/os-release
if [[ ! "$ID" =~ ^(ubuntu|debian)$ ]]; then
    print_error "This script requires Ubuntu or Debian. Detected: $ID"
    exit 1
fi

print_success "OS check passed: $PRETTY_NAME"

# Gather configuration
echo ""
print_step "Configuration"
echo "This script will set up RettStat on your server."
echo ""

echo "DOMAIN CONFIGURATION"
prompt DOMAIN "Domain name" "rettstat.at"
prompt ACME_EMAIL "Email for SSL certificates" "admin@${DOMAIN}"

echo ""
echo "GITHUB CONFIGURATION (for container registry & repository access)"
echo "  Create a Personal Access Token at: https://github.com/settings/tokens"
echo "  Required scopes: read:packages, repo (for private repos)"
prompt GITHUB_USERNAME "GitHub username" ""
prompt_password GITHUB_TOKEN "GitHub Personal Access Token (ghp_...)"

echo ""
echo "POCKETBASE ADMIN ACCOUNT"
echo "  Create your admin account on first access to:"
echo "  https://api.${DOMAIN}/_/ (production)"
if [ "$DEV_ENABLED" = "true" ]; then
  echo "  https://api-dev.${DOMAIN}/_/ (development)"
fi
prompt PB_ADMIN_EMAIL "PocketBase admin email (for reference)" "admin@${DOMAIN}"

echo ""
echo "DEV ENVIRONMENT"
printf "Enable development environment at dev.%s? [y/N]: " "$DOMAIN"; read -r enable_dev </dev/tty
if [[ "$enable_dev" =~ ^[Yy]$ ]]; then
    DEV_ENABLED="true"
else
    DEV_ENABLED="false"
fi

echo ""
echo "TRAEFIK DASHBOARD"
prompt TRAEFIK_USER "Dashboard username" "admin"
prompt_password TRAEFIK_PASS "Dashboard password"

echo ""
echo "SMTP CONFIGURATION (optional, press Enter to skip)"
prompt SMTP_HOST "SMTP host" ""
if [ -n "$SMTP_HOST" ]; then
    prompt SMTP_PORT "SMTP port" "587"
    prompt SMTP_USER "SMTP user" "lettermint"
    prompt_password SMTP_PASS "SMTP password"
    prompt SMTP_FROM "From email" "noreply@${DOMAIN}"
fi

# Show summary
echo ""
print_header
echo "Configuration Summary:"
echo "  Domain:      ${DOMAIN}"
echo "  Dev Env:     ${DEV_ENABLED}"
echo "  GitHub:      ${GITHUB_USERNAME}"
if [ -n "$SMTP_HOST" ]; then
    echo "  SMTP:        Configured"
else
    echo "  SMTP:        Not configured"
fi
echo ""
printf "Proceed with installation? [Y/n]: "; read -r confirm </dev/tty
if [[ "$confirm" =~ ^[Nn]$ ]]; then
    print_error "Installation cancelled"
    exit 0
fi

# Start installation
echo ""
print_step "Step 1: Installing dependencies"
sudo apt update
sudo apt install -y curl git apache2-utils ufw
print_success "Dependencies installed"

# Install Docker if not present
print_step "Step 2: Installing Docker"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh
    sudo usermod -aG docker $USER
    rm /tmp/get-docker.sh
    print_success "Docker installed"
    echo -e "${YELLOW}Note: You've been added to the docker group. This script will use sudo for Docker commands.${NC}"
else
    print_success "Docker already installed"
    # Ensure user is in docker group
    if ! groups $USER | grep -q docker; then
        sudo usermod -aG docker $USER
        echo -e "${YELLOW}Note: You've been added to the docker group. This script will use sudo for Docker commands.${NC}"
    fi
fi

# Configure firewall
print_step "Step 3: Configuring firewall"
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
print_success "Firewall configured"

# Create installation directory
print_step "Step 4: Creating installation directory"
sudo mkdir -p "$INSTALL_DIR"
sudo chown -R $USER:$USER "$INSTALL_DIR"
cd "$INSTALL_DIR"
print_success "Installation directory created: $INSTALL_DIR"

# Clone repository if not exists
print_step "Step 5: Cloning repository"

# Check if repo exists and is a valid git repo
if [ -d "repo/.git" ]; then
    # Update existing repo - configure credentials temporarily
    cd repo
    git remote set-url origin "https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/PhilRoli/rettstat.git"
    git pull
    git remote set-url origin "$REPO_URL"
    cd ..
    print_success "Repository updated"
elif [ -d "repo" ]; then
    # Directory exists but not a valid git repo - remove and re-clone
    print_step "Removing incomplete repo directory..."
    rm -rf repo
    git clone "https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/PhilRoli/rettstat.git" repo
    cd repo
    git remote set-url origin "$REPO_URL"
    cd ..
    print_success "Repository cloned"
else
    # Fresh clone
    git clone "https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/PhilRoli/rettstat.git" repo
    cd repo
    git remote set-url origin "$REPO_URL"
    cd ..
    print_success "Repository cloned"
fi

# Verify repo was cloned successfully
if [ ! -f "repo/docker/docker-compose.prod.yml" ]; then
    print_error "Repository clone failed or is incomplete"
    print_error "Please check your GitHub token and try again"
    exit 1
fi

# Create .env file
print_step "Step 6: Creating environment file"

# Generate Traefik auth hash (escape $ for docker-compose)
TRAEFIK_AUTH=$(htpasswd -nb "$TRAEFIK_USER" "$TRAEFIK_PASS" | sed 's/\$/\$\$/g')

# Convert username to lowercase for Docker image references
GITHUB_USERNAME_LOWER=$(echo "$GITHUB_USERNAME" | tr '[:upper:]' '[:lower:]')

cat > .env <<EOF
# RettStat Production Environment
# Generated on $(date)

# Domain Configuration
DOMAIN=${DOMAIN}
ACME_EMAIL=${ACME_EMAIL}

# GitHub Container Registry
GITHUB_USERNAME=${GITHUB_USERNAME_LOWER}
GITHUB_TOKEN=${GITHUB_TOKEN}

# Traefik Dashboard Authentication
TRAEFIK_AUTH=${TRAEFIK_AUTH}
EOF

if [ -n "$SMTP_HOST" ]; then
    cat >> .env <<EOF

# SMTP Configuration
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
SMTP_FROM=${SMTP_FROM}
EOF
fi

chmod 600 .env
print_success "Environment file created"

# Copy docker-compose file
print_step "Step 7: Setting up Docker Compose"
cp repo/docker/docker-compose.prod.yml ./docker-compose.yml

# Copy PocketBase init scripts
sudo mkdir -p pocketbase-init
sudo chown -R $USER:$USER pocketbase-init
cp repo/docker/pocketbase-init/* pocketbase-init/
chmod +x pocketbase-init/init.sh

# Copy scripts (use sudo to handle permission issues from previous runs)
sudo mkdir -p scripts backups logs
sudo chown -R $USER:$USER scripts backups logs
cp repo/scripts/*.sh scripts/
chmod +x scripts/*.sh
print_success "Docker Compose configured"

# Create systemd service
print_step "Step 8: Creating systemd service"
sudo tee /etc/systemd/system/rettstat.service > /dev/null <<EOF
[Unit]
Description=RettStat Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${INSTALL_DIR}
EnvironmentFile=${INSTALL_DIR}/.env
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable rettstat.service
print_success "Systemd service created"

# Setup cron jobs
print_step "Step 9: Setting up cron jobs"
CRON_TEMP=$(mktemp)

if [ "$DEV_ENABLED" = "true" ]; then
    # Hourly database sync for dev environment
    echo "0 * * * * ${INSTALL_DIR}/scripts/sync-db.sh" >> "$CRON_TEMP"
fi

# Daily backup at 2 AM
echo "0 2 * * * ${INSTALL_DIR}/scripts/backup.sh" >> "$CRON_TEMP"

crontab -l 2>/dev/null | cat - "$CRON_TEMP" | crontab -
rm "$CRON_TEMP"
print_success "Cron jobs configured"

# Start services
print_step "Step 10: Starting services"

# Login to GitHub Container Registry
echo "$GITHUB_TOKEN" | sudo docker login ghcr.io -u "$GITHUB_USERNAME_LOWER" --password-stdin
print_success "Logged in to GitHub Container Registry"

sudo docker compose up -d
print_success "Services started"

# Wait a moment for containers to start
sleep 5

# Show completion message
echo ""
print_header
echo -e "${GREEN}                    ✅ Setup Complete!${NC}"
print_header
echo ""
echo "Your RettStat instance is now running!"
echo ""
echo "PRODUCTION URLS:"
echo "  App:              https://${DOMAIN}"
echo "  API (PocketBase): https://api.${DOMAIN}"
echo "  PocketBase Admin: https://api.${DOMAIN}/_/"
echo "  Traefik Dashboard: https://traefik.${DOMAIN}"
echo ""

if [ "$DEV_ENABLED" = "true" ]; then
    echo "DEVELOPMENT URLS:"
    echo "  App:              https://dev.${DOMAIN}"
    echo "  API (PocketBase): https://api-dev.${DOMAIN}"
    echo "  PocketBase Admin: https://api-dev.${DOMAIN}/_/"
    echo ""
fi

echo "NEXT STEPS:"
echo "  1. Configure DNS records (see below)"
echo "  2. Wait for SSL certificates (may take a few minutes)"
echo "  3. Access PocketBase admin UI and create your account:"
echo "     https://api.${DOMAIN}/_/"
echo "     (Collections will be auto-created on first startup)"
if [ "$DEV_ENABLED" = "true" ]; then
    echo "  4. Grant dev access to users via profiles.dev_access"
fi
echo ""
echo "DNS RECORDS REQUIRED:"
echo "  Type  Host     Value"
SERVER_IP=$(curl -s https://api.ipify.org)
echo "  A     @        ${SERVER_IP}"
echo "  A     www      ${SERVER_IP}"
echo "  A     api      ${SERVER_IP}"
echo "  A     traefik  ${SERVER_IP}"
if [ "$DEV_ENABLED" = "true" ]; then
    echo "  A     dev      ${SERVER_IP}"
    echo "  A     api-dev  ${SERVER_IP}"
fi
echo ""
echo "USEFUL COMMANDS:"
echo "  View logs:       cd ${INSTALL_DIR} && docker compose logs -f"
echo "  Restart:         sudo systemctl restart rettstat"
echo "  Manual backup:   ${INSTALL_DIR}/scripts/backup.sh"
echo "  Check status:    docker compose ps"
echo ""
echo "Configuration saved to: ${INSTALL_DIR}/.env"
print_header
