FROM node:18.20.8-bullseye

# Install deps (Debian-based, avoids musl issue with swc/sharp)
RUN apt-get update && apt-get install -y \
  build-essential \
  python3 \
  python3-pip \
  autoconf \
  automake \
  zlib1g-dev \
  libpng-dev \
  libvips-dev \
  bash \
  git \
  && rm -rf /var/lib/apt/lists/*

# Set env
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/app

# Install dependencies first
COPY ./package.json ./package-lock.json ./
RUN npm install -g node-gyp
RUN npm config set fetch-retry-maxtimeout 600000 -g && npm ci

# Copy rest of app
COPY . .

# Fix swc core mismatch (rebuild inside container)
RUN npm rebuild @swc/core --force

# Ensure node user owns files
RUN chown -R node:node /opt/app
USER node

# Build Strapi admin
RUN npm run build

EXPOSE 1337

# Ensure entrypoint is executable
RUN chmod +x /opt/app/entrypoint.sh

ENTRYPOINT ["/opt/app/entrypoint.sh"]