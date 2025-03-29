# Use Node.js as base image
FROM node:18-bullseye

# Set the working directory to the backend folder
WORKDIR /app

# Copy only the backend folder into the container
COPY . /app

# Verify contents inside the container (for debugging)
RUN ls -R /app

# Install dependencies
RUN npm install

# Start the backend server
CMD ["node", "index.js"]
