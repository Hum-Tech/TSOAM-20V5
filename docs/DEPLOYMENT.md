# Production Deployment Guide

## Prerequisites

- Node.js 18+
- MySQL 8.0+
- NPM or Yarn

## Quick Deployment

1. Extract system files
2. Install dependencies: `npm install`
3. Configure environment: Copy `.env.example` to `.env`
4. Setup database: `npm run mysql:production`
5. Build system: `npm run build-production`
6. Start server: `npm start`

## Default Credentials

- Email: admin@tsoam.org
- Password: admin123

**⚠️ Change default password after first login in production!**
