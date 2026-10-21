FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
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
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 3100
CMD ["node", "dist/main.js"]
