FROM node:19-alpine

# Define environment variables
ARG _WORKDIR=/home/node/app
ARG PORT=3333

# Switch to root user to install system packages
USER root

# Install Git (if needed) and any other system dependencies
RUN apk add --no-cache git

# Create a directory for your application
WORKDIR ${_WORKDIR}

# Copy your project files into the container
ADD . ${_WORKDIR}

# Install your project's dependencies using npm
RUN npm install

# Switch back to the node user
USER node

# Expose the desired port
EXPOSE ${PORT}

# Define the command to start your application
CMD ["npm", "start"]