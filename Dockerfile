# ────────────────────────────────────────────────────────────────────────────
# Build stage: install deps + run vite build
# ────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Copy BOTH manifest + lockfile up front so the install layer caches well
# and `npm ci` has everything it needs to produce a deterministic tree.
COPY package.json package-lock.json ./

# Install strategy:
#   1. Try `npm ci` first — it installs the exact tree from the lockfile,
#      which prevents "works locally, fails on CI because a new transitive
#      version was resolved" bugs (the Mongoose typings story from before).
#   2. If `npm ci` fails (usually because package.json drifted from
#      package-lock.json — someone committed package.json without
#      regenerating the lockfile), fall back to `npm install` so the
#      build still goes through. We log a WARN so the drift is visible in
#      the build output and can be cleaned up later.
#
# This keeps the deterministic-build benefit on the happy path while not
# blocking a deploy on a lockfile-sync mistake.
RUN npm ci --no-audit --no-fund \
  || ( \
    echo "⚠️  npm ci failed (package.json / package-lock.json out of sync). Falling back to npm install. Resync the lockfile locally and commit it to restore deterministic builds." \
    && npm install --no-audit --no-fund \
  )

# Copy source after the install layer so routine code edits don't bust the
# cached deps. A sibling .dockerignore keeps local node_modules/.git/dist
# out so they don't poison this copy.
COPY . .

# Vite + tsc can be memory-hungry on big projects; generous cap avoids
# `JavaScript heap out of memory` on small build runners.
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm run build

# ────────────────────────────────────────────────────────────────────────────
# Runtime stage: slim Nginx serving the built static assets
# ────────────────────────────────────────────────────────────────────────────
FROM nginx:alpine

# Replace default Nginx document root with the built SPA.
RUN rm -rf /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
