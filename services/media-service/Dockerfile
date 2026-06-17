FROM node:24-alpine

WORKDIR /app

ENV CI=true

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/media-service/package.json ./services/media-service/

RUN pnpm install --filter media-service...

COPY services/media-service ./services/media-service

WORKDIR /app/services/media-service

EXPOSE 3005

CMD ["pnpm", "run", "dev"]