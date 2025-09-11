# Use Node.js official image
FROM node:22

# Set working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose port 3000 to the outside world
EXPOSE 3000

# Command to start the app
CMD ["node", "src/server.js"]
