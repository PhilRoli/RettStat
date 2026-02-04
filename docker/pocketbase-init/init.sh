#!/bin/sh
set -e

echo "=== PocketBase Auto-Initialization Script ==="

# Configuration
PB_HOST="${PB_HOST:-pocketbase}"
PB_PORT="${PB_PORT:-8090}"
PB_URL="http://${PB_HOST}:${PB_PORT}"
INIT_MARKER="/pb_data/.initialized"
MAX_WAIT=60

# Check if already initialized
if [ -f "$INIT_MARKER" ]; then
  echo "✓ PocketBase already initialized (marker found at $INIT_MARKER)"
  echo "  To re-initialize, delete the marker file and restart."
  exit 0
fi

echo "→ First-time initialization detected"

# Validate required environment variables
if [ -z "$PB_ADMIN_EMAIL" ] || [ -z "$PB_ADMIN_PASSWORD" ]; then
  echo "✗ Error: PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD must be set"
  exit 1
fi

echo "→ Waiting for PocketBase to be ready at $PB_URL..."

# Wait for PocketBase health check
wait_time=0
until curl -sf "$PB_URL/api/health" > /dev/null 2>&1; do
  if [ $wait_time -ge $MAX_WAIT ]; then
    echo "✗ Timeout waiting for PocketBase after ${MAX_WAIT}s"
    exit 1
  fi
  echo "  Waiting... (${wait_time}s)"
  sleep 2
  wait_time=$((wait_time + 2))
done

echo "✓ PocketBase is ready"

# Create superuser account
echo "→ Creating superuser account..."
CREATE_OUTPUT=$(docker exec rettstat-pocketbase pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" 2>&1)
CREATE_EXIT=$?

if [ $CREATE_EXIT -eq 0 ]; then
  echo "✓ Superuser account created/updated"
else
  echo "✗ Failed to create/update superuser: $CREATE_OUTPUT"
  exit 1
fi

# Authenticate as admin to get token
echo "→ Authenticating as admin..."
AUTH_RESPONSE=$(curl -sf -X POST "$PB_URL/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$PB_ADMIN_EMAIL\",\"password\":\"$PB_ADMIN_PASSWORD\"}" 2>&1)

if [ $? -ne 0 ]; then
  echo "✗ Failed to authenticate as admin (curl error)"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

ADMIN_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.token // empty')

if [ -z "$ADMIN_TOKEN" ]; then
  echo "✗ Failed to extract admin token"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

echo "✓ Admin authenticated"

# Create collections using Node.js script
echo "→ Creating collections from schema..."
node /init/create-collections.js "$PB_URL" "$ADMIN_TOKEN"

if [ $? -eq 0 ]; then
  echo "✓ Collections created successfully"
else
  echo "✗ Failed to create collections"
  exit 1
fi

# Create initialization marker
echo "→ Creating initialization marker..."
touch "$INIT_MARKER"
echo "✓ Initialization marker created"

echo "=== PocketBase Initialization Complete ==="
echo ""
echo "Admin credentials:"
echo "  Email: $PB_ADMIN_EMAIL"
echo "  Admin UI: http://localhost:8090/_/"
echo ""

exit 0
