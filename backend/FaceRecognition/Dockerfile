FROM python:3.10

# Set working directory
WORKDIR /app

# Copy requirements.txt from parent directory
COPY ../requirements.txt ./requirements.txt

# Install system dependencies and Python packages
RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    libgtk-3-dev \
    libboost-all-dev \
    libopenblas-dev \
    liblapack-dev \
    && apt-get clean \
    && pip install --no-cache-dir -r requirements.txt

# Copy all FaceRecognition source code
COPY . .

# Expose Flask port
EXPOSE 5001

# Run the Flask app
CMD ["flask", "--app", "server", "run", "--host=0.0.0.0", "--port=5001"]
