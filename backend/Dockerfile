FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm pkg delete scripts.prepare && npm ci --omit=dev

COPY src ./src

ENV PORT=4000
EXPOSE 4000

CMD ["node", "src/server.js"]
