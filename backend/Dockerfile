# Use Node.js as base image
FROM node:18-bullseye

# Set the working directory inside the container
WORKDIR /app

# Copy everything inside 'backend' folder to '/app' in the container
COPY backend/. .

# Verify contents inside the container (for debugging)
RUN ls -R /app

# Install dependencies
RUN npm install

# Start the backend server
CMD ["node", "index.js"]
