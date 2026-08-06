FROM node:20-alpine

WORKDIR /app

# Dependencies pehle copy karo (caching ke liye)
COPY package*.json ./
RUN npm ci --only=production

# Source code copy karo
COPY . .

# Non-root user (security)
RUN addgroup -g 1001 -S nodejs && adduser -S adwall -u 1001
USER adwall

EXPOSE 5000

CMD ["node", "server.js"]
