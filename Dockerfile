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

# ── Build-time env vars for Vite ─────────────────────────────────────────
# Vite inlines `import.meta.env.VITE_*` at BUILD time — the browser never
# reads env vars at runtime. Values must therefore be present inside this
# build stage, not just in the runtime container. On DigitalOcean App
# Platform that means:
#   1. Declare the env var in the app spec with scope `BUILD_TIME` (or
#      `RUN_AND_BUILD_TIME`). Runtime-only scope won't reach `npm run build`.
#   2. DO passes build-time env vars as Docker build args — we re-export
#      them as ENV below so Vite actually sees them during the build.
#
# Add new entries here whenever you introduce another VITE_* env var.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Vite + tsc can be memory-hungry on big projects; generous cap avoids
# `JavaScript heap out of memory` on small build runners.
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Fail-fast sanity check — if the env var is empty the resulting bundle
# would silently ship with an undefined API base URL (what caused the
# "Missing environment variables" runtime error). Better to refuse to
# build than to push a broken bundle.
RUN if [ -z "$VITE_API_BASE_URL" ]; then \
      echo "❌ VITE_API_BASE_URL is empty at build time." >&2 ; \
      echo "   Set it in the DO App Platform app spec with scope BUILD_TIME (or RUN_AND_BUILD_TIME)." >&2 ; \
      exit 1 ; \
    fi

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
