# The panel is a static bundle, so what runs in production is a web server
# holding files — there is no Node process here at all.
#
# Every route is rendered by the browser, so any path that is not a file has to
# return index.html rather than a 404: reloading /buyurtmalar must not break.
#
# It also forwards /v1 to the backend, which is what makes `api.ts`'s relative
# base true. In development Vite proxies that path; in production nothing did,
# so the panel asked its own origin for /v1/kirish/parol and nginx answered 405
# — the panel could not sign anybody in on any domain.
#
# Pointing the bundle at api.<domain> instead would have been the other repair
# and a worse one: the session is an HttpOnly cookie, and sending it to another
# origin means SameSite=None, a CORS allow-list naming the panel, and a cookie
# that now rides along on cross-site requests. Same origin needs none of that,
# and it is what the code already says it does.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1-alpine AS run
COPY --from=build /app/dist /usr/share/nginx/html

# A template rather than a finished config: nginx's own entrypoint runs
# envsubst over /etc/nginx/templates, so the backend's address is deployment
# configuration instead of something baked into the image.
ENV BACKEND_ORIGIN=http://flex-backend-app-1:8090
RUN mkdir -p /etc/nginx/templates && printf '%s\n' \
  'server {' \
  '  listen 80;' \
  '  root /usr/share/nginx/html;' \
  '' \
  '  # Docker embedded DNS. Named here because proxy_pass through a variable' \
  '  # resolves per request: without it nginx resolves the backend once at' \
  '  # startup and keeps that address, so the first backend deploy after this' \
  '  # one leaves the panel talking to a container that no longer exists.' \
  '  resolver 127.0.0.11 ipv6=off valid=30s;' \
  '  set $backend "${BACKEND_ORIGIN}";' \
  '' \
  '  location /v1/ {' \
  '    proxy_pass $backend$request_uri;' \
  '    proxy_set_header Host $host;' \
  '    proxy_set_header X-Real-IP $remote_addr;' \
  '    # Appended, not replaced: Traefik already wrote the visitor address and' \
  '    # the backend counts rate limits from it. Overwriting would make every' \
  '    # request through the panel look like it came from this container.' \
  '    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' \
  '    proxy_set_header X-Forwarded-Proto $scheme;' \
  '  }' \
  '' \
  '  # The hashed assets never change under a given name, so they can be held' \
  '  # for a year. index.html must not be, or a deploy ships to nobody.' \
  '  location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }' \
  '  location / { try_files $uri $uri/ /index.html; }' \
  '}' > /etc/nginx/templates/default.conf.template
EXPOSE 80
