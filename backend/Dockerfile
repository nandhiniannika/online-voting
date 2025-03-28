# Use official Node.js image
FROM node:18-bullseye

# Set the working directory
WORKDIR /app

# Copy package files first to take advantage of caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps  # Removes --mount=type=cache

# Copy the rest of the app
COPY . .

# Expose port (change if needed)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
