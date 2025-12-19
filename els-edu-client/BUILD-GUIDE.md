# Quick Build Guide

## Your Current Workflow Issue

You're building locally → pushing to Docker Hub → pulling on server with docker-compose.

**The Problem**: Environment variables in docker-compose are set at **runtime**, but Vite needs them at **build time**.

## ✅ FIX: Update Your Local Build

Make sure your local `.env` file has production values:

```env
VITE_API_URL=https://emeelan.com/els-kidsserver/api
VITE_ABLY_API_KEY=CAtV_w.YQ2YJA:CFTY08KNi__TxbRH5bTjFRgjWPUjYwj8mCLFNtccCeA
VITE_CASHFREE_ENV=production
```

Then build:

```bash
cd /home/dhruv/work-dhruv/hph/els-kids-revamp/els-edu-client
docker build -t harishdell/els-kids:1.7 .
docker push harishdell/els-kids:1.7
```

The `.env` file will be copied and used during the build.

## On Your Server

Pull and restart:

```bash
docker-compose pull
docker-compose up -d
```

The environment variables in your docker-compose.yml won't affect the client (they're ignored), but won't cause harm either.

## Why This is Different

- **Server (Strapi/Node)**: Reads env vars at runtime ✅ docker-compose env works
- **Client (Vite/React)**: Env vars baked into JS at build time ✅ Need to set before building

That's why your server works with docker-compose env vars but client doesn't.
