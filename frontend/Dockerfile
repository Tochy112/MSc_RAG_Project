FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm pkg delete scripts.prepare && npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
