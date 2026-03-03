FROM node:20-alpine AS builder

WORKDIR /app

# Copy frontend package files (build context is repo root)
COPY frontend/package*.json ./

RUN npm ci

# Copy frontend source
COPY frontend/ .

# Build the app
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
