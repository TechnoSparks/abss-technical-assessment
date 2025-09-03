FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port 4200
EXPOSE 4200

# Start Angular development server
CMD ["npm", "start"]
