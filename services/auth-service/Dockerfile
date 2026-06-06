FROM node:24-alpine

WORKDIR /app

ENV CI=true
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN corepack prepare pnpm@11.5.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install

COPY . .

EXPOSE 3001

CMD ["sh", "-c", "pnpm exec prisma generate && pnpm dev"]