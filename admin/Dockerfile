# The panel is a static bundle, so what runs in production is a web server
# holding files — there is no Node process here at all.
#
# Every route is rendered by the browser, so any path that is not a file has to
# return index.html rather than a 404: reloading /buyurtmalar must not break.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1-alpine AS run
COPY --from=build /app/dist /usr/share/nginx/html
RUN printf '%s\n' \
  'server {' \
  '  listen 80;' \
  '  root /usr/share/nginx/html;' \
  '  # The hashed assets never change under a given name, so they can be held' \
  '  # for a year. index.html must not be, or a deploy ships to nobody.' \
  '  location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }' \
  '  location / { try_files $uri $uri/ /index.html; }' \
  '}' > /etc/nginx/conf.d/default.conf
EXPOSE 80
