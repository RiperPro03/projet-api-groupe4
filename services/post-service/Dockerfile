FROM node:24-alpine

WORKDIR /app

ENV CI=true

RUN corepack enable

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

EXPOSE 3003

RUN npm run build

CMD ["npm", "run", "start"]
