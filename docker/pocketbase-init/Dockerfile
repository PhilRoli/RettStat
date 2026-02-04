# Lightweight init container for PocketBase setup
FROM node:20-alpine

# Install required tools
RUN apk add --no-cache \
    curl \
    jq \
    docker-cli

WORKDIR /init

# Copy initialization scripts
COPY init.sh /init/init.sh
COPY create-collections.js /init/create-collections.js

# Make init script executable
RUN chmod +x /init/init.sh

# Run init script
CMD ["/init/init.sh"]
