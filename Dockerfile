# Base image with Node and Playwright dependencies
FROM mcr.microsoft.com/playwright:v1.43.0-jammy

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Start production server
CMD ["npm", "start"]
