FROM node:24-alpine

WORKDIR /app

ENV CI=true

RUN corepack enable

COPY package.json ./

RUN pnpm install

COPY . .

EXPOSE 3007

RUN pnpm run build

CMD ["pnpm", "run", "start"]
