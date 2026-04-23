# ────────────────────────────────────────────────────────────────────────────
# Build stage: install deps + run vite build
# ────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Copy BOTH manifest + lockfile up front so the install layer caches well
# and `npm ci` has everything it needs to produce a deterministic tree.
COPY package.json package-lock.json ./

# `npm ci` installs from the lockfile exactly — prevents the "works locally,
# fails in Docker because a new transitive version was resolved" class of
# build break. `--no-audit --no-fund` keeps the CI log tidy.
RUN npm ci --no-audit --no-fund

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
