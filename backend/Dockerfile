# Use Node.js as base image
FROM node:18-bullseye

# Set the working directory
WORKDIR /app

# Copy everything inside the backend directory
COPY . .

# Verify contents inside the container (for debugging)
RUN ls -R /app

# Install dependencies
RUN npm install

# Start the backend server
CMD ["node", "index.js"]
