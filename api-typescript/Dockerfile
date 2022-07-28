FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json .

RUN npm install

COPY src ./src

RUN npx tsc

EXPOSE 3000

CMD ["node", "dist/app.js"]
