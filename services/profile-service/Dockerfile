FROM node:24-alpine

WORKDIR /app

ENV CI=true

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install

COPY . .

EXPOSE 3006

RUN pnpm run build

CMD ["pnpm", "run", "start"]
