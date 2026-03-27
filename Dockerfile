# Stage 1: Build the application
FROM node:22-alpine3.22 as build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the NestJS application
RUN npm run build

# Stage 2: Run the application
FROM node:22-alpine3.22 as final

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the built application from the Build stage
COPY --from=build /app/dist ./dist

# Copy package.json and package-lock.json to the working directory
COPY --from=build /app/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main"]