# Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Make sure both Node and PHP (for the frontend) are available
RUN apk add --no-cache \
    php \
    php-session \
    php-mbstring \
    php-xml \
    php-curl

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    PHP_DEV_HOST=0.0.0.0 \
    PHP_PUBLIC_HOST=localhost \
    PHP_DEV_PORT=8081

# Install deps first for better caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the project
COPY . .

EXPOSE 3000 8081
CMD ["npm", "start"]
