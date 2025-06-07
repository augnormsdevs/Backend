# Stage 1: Build TypeScript project
FROM node:latest AS build
# Set the working directory in the container
WORKDIR /usr/src/app
# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./
# Install dependencies
RUN npm install
# Copy the rest of the application code to the working directory
COPY . .
# Compile TypeScript to JavaScript
RUN npm run build
# Stage 2: Create production image
FROM node:latest
# Set the working directory in the container
WORKDIR /usr/src/app
# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./
# Install only production dependencies
RUN npm install --production
# Copy compiled JavaScript files from the build stage
COPY --from=build /usr/src/app/dist ./dist

# Copy email template file to the working directory
COPY ./src/emailNotification.html ./dist/emailNotification.html

COPY ./src/emailTemplate.html ./dist/emailTemplate.html

# Expose the port the app runs on
EXPOSE 3000
# Command to run the application
CMD ["node", "dist/index.js"]