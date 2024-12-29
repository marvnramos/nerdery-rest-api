# Use Node.js as the base image
FROM node:16

# Set the working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application
COPY . .

# Build the NestJS application
RUN npm run build

# Expose the port (the default port for NestJS is 3000)
EXPOSE 3000

# Command to run the app
CMD ["node", "dist/main"]
