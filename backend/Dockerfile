# Builds the SPA and the API into one image. The API serves both: there is no
# nginx in the stack, and a hospital that wants TLS or its own routing puts a
# reverse proxy in front of this service (see nginx/ for a sample config).
#
# Build context is the repository root, not backend/.

FROM node:20-alpine AS ui-builder
WORKDIR /ui
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/ .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
# ts-node runs prisma/seed.ts at runtime (`npx prisma db seed`, as the
# runbooks document). Without tsconfig.json it falls back to its defaults,
# resolves the .ts file through Node's ESM loader and fails with
# ERR_UNKNOWN_FILE_EXTENSION.
COPY --from=builder /app/tsconfig.json ./
# The SPA, served by the API at the paths main.ts registers.
COPY --from=ui-builder /ui/dist ./public
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 3100
CMD ["node", "dist/main.js"]
