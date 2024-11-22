# Use a Node.js base image
FROM node:20

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project to the container
COPY . .


ENV SESSION_SECRET="NOJBrw5SVs2dKfCbsJ+JGmfCbaTW/F2VGbSeSevdjSg="


# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
