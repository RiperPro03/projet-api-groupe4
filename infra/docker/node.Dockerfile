FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY services ./services
COPY packages ./packages

RUN pnpm install

ARG SERVICE_PATH
WORKDIR /app/${SERVICE_PATH}

CMD ["pnpm", "dev"]