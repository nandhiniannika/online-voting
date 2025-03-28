# Use a base image with Node.js and Python support
FROM node:18-bullseye

# Update package lists and install Python 3 & Pip
RUN apt update && apt install -y python3 python3-pip && ln -s /usr/bin/python3 /usr/bin/python

# Set the working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with caching optimization
RUN --mount=type=cache,target=/app/node_modules/.cache npm install

# Copy the rest of the application files
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the application
CMD ["node", "index.js"]
