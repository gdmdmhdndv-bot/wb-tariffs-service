### Stage 1: Install production dependencies
FROM node:20-alpine AS deps-prod

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --omit=dev --ignore-scripts

### Stage 2: Build TypeScript
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --ignore-scripts

COPY . .

RUN npm run build

### Stage 3: Production image
FROM node:20-alpine AS prod

WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production

CMD ["npm", "run", "start"]
