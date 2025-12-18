# Client Deployment Guide

## 🚨 Important: Environment Variables in Production

When deploying this Vite application, environment variables **must be provided at build time**, not runtime. The Dockerfile has been configured to accept build arguments.

## 🐳 Docker Build & Deploy

### Option 1: Using `docker build` with Build Arguments

```bash
# Build the image with environment variables
docker build \
  --build-arg VITE_API_URL=https://emeelan.com/els-kidsserver/api \
  --build-arg VITE_ABLY_API_KEY=CAtV_w.YQ2YJA:CFTY08KNi__TxbRH5bTjFRgjWPUjYwj8mCLFNtccCeA \
  --build-arg VITE_CASHFREE_ENV=production \
  -t els-edu-client:latest \
  .

# Run the container
docker run -d -p 80:80 --name els-client els-edu-client:latest
```

### Option 2: Using `.env` file with Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: "3.8"

services:
  client:
    build:
      context: .
      args:
        VITE_API_URL: https://emeelan.com/els-kidsserver/api
        VITE_ABLY_API_KEY: CAtV_w.YQ2YJA:CFTY08KNi__TxbRH5bTjFRgjWPUjYwj8mCLFNtccCeA
        VITE_CASHFREE_ENV: production
    ports:
      - "80:80"
    restart: unless-stopped
```

Then deploy:

```bash
docker-compose up -d --build
```

### Option 3: Using `.env.production` File

Create a `.env.production` file in the project root (remember to **NOT** commit this to git if it contains secrets):

```env
VITE_API_URL=https://emeelan.com/els-kidsserver/api
VITE_ABLY_API_KEY=CAtV_w.YQ2YJA:CFTY08KNi__TxbRH5bTjFRgjWPUjYwj8mCLFNtccCeA
VITE_CASHFREE_ENV=production
```

Then modify your Dockerfile to copy this file before build:

```dockerfile
# After COPY . .
COPY .env.production .env
```

**Note:** This approach is less secure as the file would need to be on the server.

## 🔄 Rebuild After Code Changes

After making code changes, you **must rebuild** the Docker image:

```bash
# Stop and remove old container
docker stop els-client
docker rm els-client

# Rebuild with build args
docker build \
  --build-arg VITE_API_URL=https://emeelan.com/els-kidsserver/api \
  --build-arg VITE_ABLY_API_KEY=CAtV_w.YQ2YJA:CFTY08KNi__TxbRH5bTjFRgjWPUjYwj8mCLFNtccCeA \
  --build-arg VITE_CASHFREE_ENV=production \
  -t els-edu-client:latest \
  .

# Run new container
docker run -d -p 80:80 --name els-client els-edu-client:latest
```

## 🔍 Verify the Build

Check if environment variables are correctly baked into the build:

```bash
# Build and inspect
docker build --build-arg VITE_API_URL=https://emeelan.com/els-kidsserver/api -t test-build .

# Run container temporarily and check built files
docker run --rm test-build sh -c "grep -r 'emeelan.com' /usr/share/nginx/html/assets/*.js | head -1"
```

You should see your API URL in the output, confirming it's baked into the JavaScript bundle.

## ⚠️ Common Issues

1. **Still seeing localhost in requests?**

   - Make sure you rebuilt the image with `--no-cache` flag:
     ```bash
     docker build --no-cache --build-arg VITE_API_URL=... -t els-edu-client .
     ```

2. **Environment variables not working?**

   - Ensure ARG names match exactly (case-sensitive)
   - Verify you're passing `--build-arg` during `docker build`
   - For CI/CD, ensure environment variables are set in your pipeline

3. **Using a deployment platform (Vercel, Netlify, etc.)?**
   - Set environment variables in the platform's dashboard
   - They automatically inject them during build

## 📝 CI/CD Integration

If using GitHub Actions, GitLab CI, or similar:

```yaml
# Example for GitHub Actions
- name: Build Docker Image
  run: |
    docker build \
      --build-arg VITE_API_URL=${{ secrets.VITE_API_URL }} \
      --build-arg VITE_ABLY_API_KEY=${{ secrets.VITE_ABLY_API_KEY }} \
      --build-arg VITE_CASHFREE_ENV=production \
      -t els-edu-client:latest \
      .
```

Store secrets in your CI/CD platform's secrets management.
