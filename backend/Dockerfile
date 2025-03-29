# Use Node.js as base image
FROM node:18-bullseye

# Set the working directory inside the container
WORKDIR /app

# Copy everything from the current directory into the container
COPY . .

# Verify contents inside the container (for debugging)
RUN ls -R /app

# Install dependencies
RUN npm ci

# Expose backend port (if applicable)
EXPOSE 5000

# Start the backend server
CMD ["node", "index.js"]
