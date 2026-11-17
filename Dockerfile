FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY public ./public

# commit id shown at /api/version (set by the CI pipeline)
ARG GIT_SHA=local
ENV GIT_SHA=$GIT_SHA

# notes are stored in /data (mounted as a Docker volume)
ENV DATA_FILE=/data/notes.json
RUN mkdir -p /data && chown -R node:node /data /app
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
