# Backend Environment Configuration Guide

## Overview

This guide explains how to configure and set up the backend environment variables for the YT-X Clone application.

## Prerequisites

- Node.js 14.0 or higher
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (for image/video storage)
- JWT secret keys (any secure string)

## Step-by-Step Setup

### 1. MongoDB Configuration

#### Option A: MongoDB Atlas (Cloud)

1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or sign in
3. Create a new cluster
4. Get your connection string
5. Update `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/yt-x-clone?retryWrites=true&w=majority
   ```

#### Option B: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Update `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/yt-x-clone
   ```

### 2. JWT Configuration

Generate secure secret keys:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this command twice and update `.env`:

```
ACCESS_TOKEN_SECRET=<first-generated-key>
ACCESS_TOKEN_EXPIRY=7d
REFRESH_TOKEN_SECRET=<second-generated-key>
REFRESH_TOKEN_EXPIRY=30d
```

### 3. Cloudinary Configuration

1. Visit [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account
3. Get your API credentials from the dashboard
4. Update `.env`:
   ```
   CLOUDINARY_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### 4. Server Configuration

```env
PORT=8000
NODE_ENV=development
```

### 5. CORS Configuration

Configure allowed origins (comma-separated):

```env
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,https://yourdomain.com
```

### 6. Email Configuration (Optional - for future notifications)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

For Gmail:
1. Enable 2-factor authentication
2. Generate app-specific password
3. Use that password in `SMTP_PASS`

### 7. Redis Configuration (Optional - for caching)

```env
REDIS_URL=redis://localhost:6379
```

Or use Redis Cloud service for production.

### 8. AWS Configuration (Optional - alternative file storage)

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

### 9. Logging Configuration

```env
LOG_LEVEL=debug
```

Options: `error`, `warn`, `info`, `debug`

## Complete .env Example

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yt-x-clone?retryWrites=true&w=majority

# Server Configuration
PORT=8000
NODE_ENV=development

# JWT Configuration
ACCESS_TOKEN_SECRET=abc123def456ghi789jkl012mno345pqr678stu901
ACCESS_TOKEN_EXPIRY=7d
REFRESH_TOKEN_SECRET=xyz987wvu654tsr321qpo012nml987kji654hgf321
REFRESH_TOKEN_EXPIRY=30d

# Cloudinary Configuration
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Redis Configuration
REDIS_URL=redis://localhost:6379

# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Logging Configuration
LOG_LEVEL=debug
```

## Environment-Specific Configurations

### Development

```env
NODE_ENV=development
LOG_LEVEL=debug
```

### Production

```env
NODE_ENV=production
LOG_LEVEL=error
CORS_ORIGIN=https://yourdomain.com
```

## Security Best Practices

1. **Never commit `.env` to version control**
   - Add `.env` to `.gitignore`
   - Use `.env.example` as a template

2. **Keep secrets secure**
   - Use strong, random values for secrets
   - Rotate secrets regularly
   - Use different secrets for different environments

3. **Use environment variables for sensitive data**
   - Database credentials
   - API keys
   - JWT secrets
   - CORS origins

4. **Access control**
   - Restrict database access to authorized IPs
   - Use strong database passwords
   - Enable MongoDB authentication

5. **HTTPS in production**
   - Always use HTTPS
   - Obtain SSL certificate
   - Update CORS_ORIGIN to use HTTPS

## Troubleshooting

### "MONGODB_URI is not defined"
- Ensure `.env` file exists in the root directory
- Check that `MONGODB_URI` is present and correctly formatted
- Verify MongoDB connection string syntax

### "Invalid Cloudinary credentials"
- Double-check `CLOUDINARY_NAME` and API keys
- Ensure credentials are from the correct Cloudinary account
- Verify account is not in restricted/limited mode

### "CORS error"
- Ensure frontend URL is in `CORS_ORIGIN`
- Format: `http://localhost:5173` (no trailing slash)
- Separate multiple URLs with commas

### "JWT token not working"
- Verify `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` are set
- Ensure tokens aren't expired
- Check token format in Authorization header

### "Database connection timeout"
- Check MongoDB connection string
- Ensure MongoDB is running
- Verify network connectivity
- Check firewall rules

## Deployment Considerations

For production deployment:

1. **Use environment management services**
   - AWS Secrets Manager
   - Azure Key Vault
   - Heroku Config Vars

2. **Set appropriate timeouts**
   - Database connection timeout
   - API request timeout

3. **Enable monitoring**
   - Error tracking (Sentry)
   - Performance monitoring (New Relic)
   - Logging service (ELK Stack)

4. **Regular backups**
   - Database backups
   - Configuration backups
   - Regular testing of restore process

## Quick Start Commands

```bash
# Copy environment template
cp .env.example .env

# Generate secure JWT secrets
node -e "console.log('ACCESS_TOKEN_SECRET:', require('crypto').randomBytes(32).toString('hex')); console.log('REFRESH_TOKEN_SECRET:', require('crypto').randomBytes(32).toString('hex'))"

# Start backend with nodemon
npm run dev

# Start backend in production
npm start
```

## Additional Resources

- [MongoDB Connection String](https://docs.mongodb.com/manual/reference/connection-string/)
- [Cloudinary API Docs](https://cloudinary.com/documentation)
- [Node.js Environment Variables](https://nodejs.org/en/knowledge/file-system/how-to-use-the-filesystem-module/env-variables/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
