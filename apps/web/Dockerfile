FROM node:24-alpine

WORKDIR /workspace
RUN corepack enable

COPY . .
RUN pnpm install --frozen-lockfile

EXPOSE 5173
CMD ["pnpm", "--filter", "@goal-tracker/web", "dev"]
