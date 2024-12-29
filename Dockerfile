# Stage 1: Build the application
FROM node:latest as builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install all dependencies including dev dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Generate the Prisma client
RUN npx prisma generate

# Build the NestJS application
RUN npm run build


# Stage 2: Create the production image
FROM node:alpine

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules

# Expose the port (default port for NestJS is 3000)
EXPOSE 3000

# Command to run the app
CMD ["npm", "run", "start:prod"]
