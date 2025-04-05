FROM python:3.10

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    libgtk-3-dev \
    libboost-all-dev \
    libopenblas-dev \
    liblapack-dev \
 && apt-get clean \
 && pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Optional: expose port if you're running Flask
EXPOSE 5001

# If you want to run server.py as a background Flask app:
# CMD ["flask", "--app", "server", "run", "--host=0.0.0.0", "--port=5001"]

# Or if this is just a utilities container to run scripts from Node:
CMD ["sleep", "infinity"]
