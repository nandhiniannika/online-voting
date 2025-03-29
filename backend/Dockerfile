# Use Node.js as base image
FROM node:18-bullseye

# Set the working directory inside the container
WORKDIR /app

# Copy everything from the current directory into the container
COPY . .

# Install system dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    python3-dev \
    python3-pip \
    python3-opencv \
    libgl1-mesa-glx \
    libglib2.0-0 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*


# Verify contents inside the container (for debugging)
RUN ls -R /app

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Install Node.js dependencies
RUN npm ci

# Expose backend port (if applicable)
EXPOSE 5000

# Start the backend server
CMD ["node", "index.js"]
