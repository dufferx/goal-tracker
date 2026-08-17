FROM node:24-alpine

WORKDIR /workspace
RUN corepack enable

COPY . .
RUN pnpm install --frozen-lockfile \
  && pnpm build:packages \
  && pnpm --filter @goal-tracker/api build

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT??3000)+'/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/api/dist/main.js"]
