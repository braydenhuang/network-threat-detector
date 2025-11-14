# Build stage
FROM node:25.1.0 AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage (serve static files with Caddy)
FROM caddy:2.10.2
COPY --from=build /app/dist /usr/share/caddy
RUN printf ":3000 {\n  root * /usr/share/caddy\n  encode gzip\n  try_files {path} /index.html\n  file_server\n}\n" > /etc/caddy/Caddyfile