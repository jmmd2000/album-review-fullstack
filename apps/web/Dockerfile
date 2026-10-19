# Stage 1: Build stage
FROM node:26.10.0-alpine AS build

# Node 25 and later no longer ship Corepack, so it comes from npm. It installs the pnpm that packageManager names.
RUN npm install -g corepack@0.36.0 && corepack enable

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

WORKDIR /app

# Copy workspace and package files
COPY pnpm-workspace.yaml .
COPY package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Set up structure for shared dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/web ./apps/web
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build the frontend
WORKDIR /app/apps/web

# Build info baked into the bundle through the vite define, so the web app
# knows its own sha independently of the api. Local builds fall back to "dev"
ARG GIT_SHA=dev
ARG BUILT_AT=""
ENV GIT_SHA=$GIT_SHA
ENV BUILT_AT=$BUILT_AT

RUN pnpm run build

# Source maps. The inject step stamps a debug ID into each bundle, and GlitchTip matches it to the uploaded map.
# The upload needs the token, so a build without it skips the upload. A failed upload warns and the build goes on.
# The step prints GIT_SHA and BUILT_AT so Docker runs it again for every build, and a failed upload is never cached.
# The maps are deleted afterwards, so the image never serves them.
# Do not set SENTRY_LOG_LEVEL=debug here, because it can print the token.
ENV SENTRY_URL=https://glitchtip.vps.jamesmddoyle.com SENTRY_ORG=james-org SENTRY_PROJECT=albums-web
RUN --mount=type=secret,id=glitchtip_token,env=SENTRY_AUTH_TOKEN \
    echo "Source maps for $GIT_SHA built at $BUILT_AT" \
 && pnpm exec sentry-cli sourcemaps inject dist \
 && if [ -n "$SENTRY_AUTH_TOKEN" ]; then \
      pnpm exec sentry-cli sourcemaps upload --release "$GIT_SHA" dist \
        || echo "WARNING: source map upload failed"; \
    else echo "No GlitchTip token, so the source maps are not uploaded"; fi \
 && find dist -name "*.map" -delete

# The ssr pass links the stylesheet by its own hash, which only matches the
# client's copy while both passes produce identical bytes. Ship the ssr copy
# so the linked file always exists
RUN cp -f dist/server/assets/*.css dist/client/assets/

# Deploy prod deps to a clean directory. The app libraries are all bundled by
# vite, so this is only the node server's own imports
WORKDIR /app
RUN pnpm --filter @album-reviews/web deploy --prod --legacy /deploy

# Stage 2: Production stage
FROM node:26.10.0-alpine AS production

WORKDIR /app

COPY --from=build /deploy/node_modules ./node_modules

# The client assets and the start server bundle, served by server.js
COPY --from=build /app/apps/web/dist ./dist
COPY apps/web/server.js .

ENV NODE_ENV=production

# The app only reads its own files, which stay root-owned, the process runs unprivileged
USER node

EXPOSE 3000

CMD ["node", "server.js"]
