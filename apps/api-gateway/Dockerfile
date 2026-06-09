FROM node:24-alpine

WORKDIR /app

ENV CI=true
ENV NODE_ENV=development

RUN corepack enable

COPY package.json pnpm-workspace.yaml ./

RUN pnpm install

COPY . .
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "run", "start"]
