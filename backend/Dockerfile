# Use a base image with Node.js and Python
FROM node:18-bullseye

# Install Python
RUN apt update && apt install -y python3 python3-pip

# Set python3 as the default python command
RUN ln -s /usr/bin/python3 /usr/bin/python

# Set the working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the application
CMD ["node", "index.js"]
