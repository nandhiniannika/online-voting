FROM python:3.10

# Set the working directory inside the container
WORKDIR /app

# Copy backend requirements file
COPY requirements.txt .

# Install system dependencies and Python packages
RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    libgtk-3-dev \
    libboost-all-dev \
    libopenblas-dev \
    liblapack-dev \
    && apt-get clean \
    && pip install --no-cache-dir --break-system-packages -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Set environment variable for Railway
ENV PORT=5000

# Expose the port
EXPOSE 5000

# Start the Flask server
CMD ["python", "FaceRecognition/server.py"]
