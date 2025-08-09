# Build stage for client
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Build stage for server
FROM node:18-alpine AS server-build
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
RUN npm install
COPY src/ ./src/
# Build server without triggering root postbuild (which tries to build client)
RUN npx nest build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built server
COPY --from=server-build /app/dist ./dist

# Copy built client
COPY --from=client-build /app/client/dist ./client/dist

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3000

CMD ["node", "dist/main.js"]
