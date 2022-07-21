FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
COPY postcss.config.js .
COPY tailwind.config.js .

RUN npm install

COPY components ./components
COPY modules ./modules
COPY pages ./pages
COPY public ./public
COPY styles ./styles

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
