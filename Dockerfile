FROM node:22-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN node scripts/seed.mjs && AUTH_SECRET=build npx next build
ENV NODE_ENV=production DATA_DIR=/data
VOLUME /data
EXPOSE 3000
# demo.db is rebuilt from the seed on every start; live.db (real records) stays in /data
CMD ["sh","-c","node scripts/seed.mjs && npx next start -p 3000"]
