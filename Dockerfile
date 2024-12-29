# Use Node.js as the base image
FROM node:latest

# Set the working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Install NestJS CLI globally
RUN npm install -g @nestjs/cli

# Copy the rest of the application
COPY . .

# Generate the Prisma client
RUN npx prisma generate

# Build the NestJS application
RUN npm run build

# Expose the port (default port for NestJS is 3000)
EXPOSE 3000

# Command to run the app
CMD ["npm", "run", "start:prod"]
