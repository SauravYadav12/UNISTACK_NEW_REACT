# Use an official Node.js runtime as a parent image
FROM node:20-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Vite app
RUN npm run build

# Use a lightweight web server to serve the static files
FROM nginx:alpine

# Remove default Nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration (if you have one, otherwise you can omit this line)
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the build files from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 for the web server
EXPOSE 8080

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]