# ==============================================================================
# Production Dockerfile: Kalvium Campus Navigator & Request Processing Simulator
# Discipline: DAA (C++ BFS/DFS) + COA (Pipeline) + FLAT (DFA Automata)
# ==============================================================================

# Base image with Node.js 20 on Debian Linux
FROM node:20-bookworm-slim AS production

# Install g++ compiler for DAA native C++ algorithms
RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    make \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package manifests first for optimal layer caching
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies across root, backend, and frontend
RUN npm run install:all

# Copy all source code, assets, and scripts
COPY . .

# Compile native C++ binaries (backend/bin/bfs and backend/bin/dfs) and build Vite frontend
RUN npm run build

# Expose default application port
ENV PORT=5000
ENV NODE_ENV=production
EXPOSE 5000

# Health check against Express API
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 5000) + '/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start unified production server (serves both React SPA and Express REST APIs)
CMD ["node", "backend/server.js"]
