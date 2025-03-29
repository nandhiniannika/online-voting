# Use Node.js base image
FROM node:18-bullseye

# Set the working directory to /app (NOT /app/backend)
WORKDIR /app

# Copy only package.json and package-lock.json first (for caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the entire backend folder contents into /app
COPY . .

# Expose the port your server runs on (change if needed)
EXPOSE 5000

# Start the app
CMD ["node", "index.js"]
