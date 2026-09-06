# The site, as a standalone Next server.
#
# Three stages so the image carries the built application and nothing that
# built it: no toolchain, no source, no dev dependencies. What ships is the
# `.next/standalone` bundle, which is only the files the server actually
# reaches at runtime.

FROM node:22-alpine AS deps
WORKDIR /app
# Dependencies in their own layer: they change far less often than the pages
# do, so editing a component does not reinstall the world.
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Public values are read at build time and baked into the client bundle, so
# they have to be present here rather than only at run time.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_TELEGRAM_BOT_NAME
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

# Not root. A process that is compromised should not also own the filesystem
# it is standing on.
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S next -G nodejs

COPY --from=build /app/public ./public
COPY --from=build --chown=next:nodejs /app/.next/standalone ./
COPY --from=build --chown=next:nodejs /app/.next/static ./.next/static

USER next
EXPOSE 3000
CMD ["node", "server.js"]
