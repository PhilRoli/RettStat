#!/bin/bash
# Manual PocketBase Collection Initialization Script
# Use this script to manually initialize or re-initialize collections
#
# Usage:
#   ./init-collections.sh [prod|dev]
#
# Examples:
#   ./init-collections.sh          # Initialize production (default)
#   ./init-collections.sh prod     # Initialize production
#   ./init-collections.sh dev      # Initialize development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${YELLOW}-> $1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_error() {
    echo -e "${RED}$1${NC}"
}

# Determine environment
ENV="${1:-prod}"
if [[ ! "$ENV" =~ ^(prod|dev)$ ]]; then
    print_error "Invalid environment: $ENV"
    echo "Usage: $0 [prod|dev]"
    exit 1
fi

echo "=== PocketBase Collection Initialization ==="
echo "Environment: $ENV"
echo ""

# Set container and host based on environment
if [ "$ENV" = "prod" ]; then
    PB_CONTAINER="rettstat-pocketbase"
    PB_HOST="pocketbase"
else
    PB_CONTAINER="rettstat-pocketbase-dev"
    PB_HOST="pocketbase-dev"
fi

# Try to load credentials from .env file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"
INSTALL_ENV_FILE="/opt/rettstat/.env"

if [ -f "$ENV_FILE" ]; then
    print_step "Loading credentials from $ENV_FILE"
    source "$ENV_FILE"
elif [ -f "$INSTALL_ENV_FILE" ]; then
    print_step "Loading credentials from $INSTALL_ENV_FILE"
    source "$INSTALL_ENV_FILE"
fi

# Prompt for missing credentials
if [ -z "$PB_ADMIN_EMAIL" ]; then
    printf "PocketBase admin email: "
    read -r PB_ADMIN_EMAIL
fi

if [ -z "$PB_ADMIN_PASSWORD" ]; then
    printf "PocketBase admin password: "
    read -rs PB_ADMIN_PASSWORD
    echo ""
fi

if [ -z "$PB_ADMIN_EMAIL" ] || [ -z "$PB_ADMIN_PASSWORD" ]; then
    print_error "Error: Admin email and password are required"
    exit 1
fi

# Check if container is running
print_step "Checking if container $PB_CONTAINER is running..."
if ! docker ps --format '{{.Names}}' | grep -q "^${PB_CONTAINER}$"; then
    print_error "Container $PB_CONTAINER is not running"
    echo "Start the container with: docker compose up -d ${PB_HOST}"
    exit 1
fi
print_success "Container is running"

# Wait for PocketBase to be healthy
PB_URL="http://127.0.0.1:8090"
if [ "$ENV" = "dev" ]; then
    # Dev environment uses different port mapping if needed
    # For internal docker network, we use the container name
    PB_URL="http://${PB_HOST}:8090"
fi

print_step "Waiting for PocketBase to be ready..."
MAX_WAIT=30
wait_time=0

# Use docker exec to check health from inside the network
until docker exec "$PB_CONTAINER" wget -q --spider "http://localhost:8090/api/health" 2>/dev/null; do
    if [ $wait_time -ge $MAX_WAIT ]; then
        print_error "Timeout waiting for PocketBase after ${MAX_WAIT}s"
        exit 1
    fi
    echo "  Waiting... (${wait_time}s)"
    sleep 2
    wait_time=$((wait_time + 2))
done
print_success "PocketBase is ready"

# Create/update superuser
print_step "Creating/updating superuser account..."
CREATE_OUTPUT=$(docker exec "$PB_CONTAINER" pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" 2>&1)
CREATE_EXIT=$?

if [ $CREATE_EXIT -eq 0 ]; then
    print_success "Superuser account created/updated"
else
    print_error "Failed to create/update superuser: $CREATE_OUTPUT"
    exit 1
fi

# Authenticate to get token
print_step "Authenticating as admin..."

# We need to run auth from within the init container or build context
# First, check if pocketbase-init container exists and has the script
INIT_CONTAINER="rettstat-pocketbase-init"
if [ "$ENV" = "dev" ]; then
    INIT_CONTAINER="rettstat-pocketbase-init-dev"
fi

# Check if we have the init scripts locally
INIT_SCRIPTS_DIR="${SCRIPT_DIR}/../docker/pocketbase-init"
if [ ! -d "$INIT_SCRIPTS_DIR" ]; then
    INIT_SCRIPTS_DIR="/opt/rettstat/pocketbase-init"
fi

if [ ! -f "${INIT_SCRIPTS_DIR}/create-collections.js" ]; then
    print_error "Cannot find create-collections.js script"
    echo "Expected location: ${INIT_SCRIPTS_DIR}/create-collections.js"
    exit 1
fi

# Build and run a temporary init container
print_step "Running collection initialization..."

# Determine the PocketBase API URL based on environment
if [ "$ENV" = "prod" ]; then
    INTERNAL_PB_URL="http://pocketbase:8090"
else
    INTERNAL_PB_URL="http://pocketbase-dev:8090"
fi

# Run init script using docker run with the same network
docker run --rm \
    --network rettstat-prod_backend \
    -e PB_HOST="$PB_HOST" \
    -e PB_PORT=8090 \
    -e PB_ADMIN_EMAIL="$PB_ADMIN_EMAIL" \
    -e PB_ADMIN_PASSWORD="$PB_ADMIN_PASSWORD" \
    -v "${INIT_SCRIPTS_DIR}:/init:ro" \
    -v /var/run/docker.sock:/var/run/docker.sock \
    node:20-alpine sh -c '
        apk add --no-cache curl docker-cli jq >/dev/null 2>&1

        PB_URL="http://${PB_HOST}:${PB_PORT}"
        PB_CONTAINER_NAME="rettstat-${PB_HOST}"

        # Create superuser
        docker exec "$PB_CONTAINER_NAME" pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" 2>&1 || true

        # Authenticate
        AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PB_URL/api/collections/_superusers/auth-with-password" \
            -H "Content-Type: application/json" \
            -d "$(jq -n --arg id "$PB_ADMIN_EMAIL" --arg pw "$PB_ADMIN_PASSWORD" \
                  '{identity: $id, password: $pw}')")

        HTTP_CODE=$(echo "$AUTH_RESPONSE" | tail -1)
        AUTH_BODY=$(echo "$AUTH_RESPONSE" | sed '$d')

        if [ "$HTTP_CODE" != "200" ]; then
            echo "Failed to authenticate (HTTP $HTTP_CODE): $AUTH_BODY"
            exit 1
        fi

        ADMIN_TOKEN=$(echo "$AUTH_BODY" | jq -r ".token // empty")

        if [ -z "$ADMIN_TOKEN" ]; then
            echo "Failed to get auth token"
            exit 1
        fi

        # Run collection script
        node /init/create-collections.js "$PB_URL" "$ADMIN_TOKEN"
    '

if [ $? -eq 0 ]; then
    print_success "Collections initialized successfully"
else
    print_error "Failed to initialize collections"
    exit 1
fi

echo ""
echo "=== Initialization Complete ==="
echo ""
echo "Admin credentials:"
echo "  Email: $PB_ADMIN_EMAIL"
if [ "$ENV" = "prod" ]; then
    echo "  Admin UI: https://api.DOMAIN/_/"
else
    echo "  Admin UI: https://api-dev.DOMAIN/_/"
fi
echo ""
echo "Replace DOMAIN with your actual domain."
