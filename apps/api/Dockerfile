FROM node:24-alpine

WORKDIR /workspace
RUN corepack enable

COPY . .
RUN pnpm install --frozen-lockfile

EXPOSE 3000
CMD ["pnpm", "--filter", "@goal-tracker/api", "dev"]
