# Step 1: Use official Node image
FROM node:18-alpine

# Step 2: Set working directory
WORKDIR /app

# Step 3: Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Step 4: Copy the rest of the app
COPY . .

# Step 5: Build the React app
RUN npm run build

# Step 6: Install `serve` to serve the build folder
RUN npm install -g serve

# Step 7: Expose port 3000 and run the app
EXPOSE 3000
CMD ["serve", "-s", "build"]
