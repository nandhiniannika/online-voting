# Use a base image with Node.js and Python support
FROM node:18-bullseye

# Install Python and necessary packages
RUN apt update && apt install -y python python-pip && ln -s /usr/bin/python3 /usr/bin/python

# Set the working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest ogit push origin mainf the application
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the application
CMD ["node", "index.js"]
