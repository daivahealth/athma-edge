# Builds the SPA and bakes it into the nginx image. Since the migration from
# Next.js there is no UI server process: nginx serves static files directly,
# which is one fewer runtime on an edge box whose job is to stay up.
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
