# Node 20 Alpine
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production=false
COPY tsconfig.json .
COPY src ./src
ENV NODE_ENV=production
CMD ["npm", "run", "dev"]
