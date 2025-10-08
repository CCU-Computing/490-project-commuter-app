FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# copy app source
COPY . .

# choose your entry file:
# if you use src/index.js, switch the CMD accordingly
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
