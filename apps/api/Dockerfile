# Stage 1: Build stage
FROM node:26.10.0 AS build

# Node 25 and later no longer ship Corepack, so it comes from npm. It installs the pnpm that packageManager names.
RUN npm install -g corepack@0.36.0 && corepack enable

WORKDIR /app

# Copy workspace and package files
COPY pnpm-workspace.yaml .
COPY package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies for the entire workspace
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build the backend
WORKDIR /app/apps/api
RUN pnpm run build

# Source maps. The inject step stamps a debug ID into the bundle, and GlitchTip matches it to the uploaded map.
# The upload needs the token, so a build without it skips the upload. A failed upload warns and the build goes on.
# The step prints GIT_SHA and BUILT_AT so Docker runs it again for every build, and a failed upload is never cached.
# The maps are deleted afterwards, so the image never ships them.
# Only the app bundle is uploaded. The drizzle files only run in the migrate container.
# Do not set SENTRY_LOG_LEVEL=debug here, because it can print the token.
ARG GIT_SHA=dev
ARG BUILT_AT=""
ENV SENTRY_URL=https://glitchtip.vps.jamesmddoyle.com SENTRY_ORG=james-org SENTRY_PROJECT=albums-api
RUN --mount=type=secret,id=glitchtip_token,env=SENTRY_AUTH_TOKEN \
    echo "Source maps for $GIT_SHA built at $BUILT_AT" \
 && pnpm exec sentry-cli sourcemaps inject dist/albums-api.js dist/albums-api.js.map \
 && if [ -n "$SENTRY_AUTH_TOKEN" ]; then \
      pnpm exec sentry-cli sourcemaps upload --release "$GIT_SHA" dist/albums-api.js dist/albums-api.js.map \
        || echo "WARNING: source map upload failed"; \
    else echo "No GlitchTip token, so the source maps are not uploaded"; fi \
 && find dist -name "*.map" -delete

# Deploy prod deps to a clean directory
WORKDIR /app
RUN pnpm --filter @album-reviews/api deploy --prod --legacy /deploy

# Stage 2: Production stage
FROM node:26.10.0-alpine AS production

# Build info baked in by Jenkins, served from the settings build-info route.
# Local builds fall back to "dev"
ARG GIT_SHA=dev
ARG GIT_MESSAGE_B64=""
ARG BUILT_AT=""
ENV GIT_SHA=$GIT_SHA
ENV GIT_MESSAGE_B64=$GIT_MESSAGE_B64
ENV BUILT_AT=$BUILT_AT

WORKDIR /app

# Copy workspace files and package files
COPY --from=build /deploy/node_modules ./node_modules

# Copy the compiled app from build. Path aliases are already rewritten to
# relative requires by tsc-alias, so nothing resolves them at runtime
COPY --from=build /app/apps/api/dist ./dist

# Ship the drizzle migration files so drizzle-kit migrate can run at deploy time
COPY --from=build /app/apps/api/drizzle ./drizzle

# Set environment
ENV NODE_ENV=production
ENV DRIZZLE_CONFIG_PATH=/app/dist/drizzle.config.js

# The app only reads its own files, which stay root-owned, the process runs unprivileged
USER node

# Expose port
EXPOSE 4000

CMD ["node", "dist/albums-api.js"]
