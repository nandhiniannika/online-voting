# Use official Node.js image
FROM node:18-bullseye

# Set the working directory
WORKDIR /app

# Copy package files first
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Expose port (change if needed)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
