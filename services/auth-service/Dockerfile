FROM node:24-alpine

WORKDIR /app

ENV CI=true


RUN corepack enable


COPY package.json pnpm-workspace.yaml ./

RUN pnpm install

COPY . .

EXPOSE 3001

RUN pnpm exec prisma generate
RUN pnpm run build

CMD ["pnpm", "run", "start"]