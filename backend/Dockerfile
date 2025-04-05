# Use Node.js as base image
FROM node:18-bullseye

# Set working directory inside container
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy the rest of your backend code
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the backend server
CMD ["node", "index.js"]
