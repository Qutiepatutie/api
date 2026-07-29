# Uses node version 24 as base image
FROM node:24

# Goes to app directory (like cd)
WORKDIR /api

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy rest of the app into the container
COPY . .

# Set port from env
ENV PORT=3000

EXPOSE 3000

# Run the app
CMD ["npm", "start"]