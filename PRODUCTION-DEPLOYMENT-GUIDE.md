# TSOAM Church Management System - Production Deployment Guide

## 🚀 Quick Start for Production

### Prerequisites
- Node.js 18+ and npm 8+
- PostgreSQL 13+ or MySQL 8+
- SSL certificate (recommended)
- Domain name configured

### 1. Environment Setup

```bash
# Clone and enter directory
git clone <repository-url> tsoam-production
cd tsoam-production

# Create production environment file
cp .env.production.template .env

# Edit configuration with your values
nano .env
```

**Required Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tsoam_production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tsoam_production
DB_USER=tsoam_user
DB_PASSWORD=your_secure_password

# Security
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Server
PORT=3000
NODE_ENV=production

# SSL (recommended)
SSL_CERT_PATH=/path/to/ssl/cert.pem
SSL_KEY_PATH=/path/to/ssl/private.key
```

### 2. Database Setup

```bash
# Initialize database schema
npm run db:init

# Run migrations
npm run db:migrate

# Sync database with application
node scripts/sync-database.js --prod
```

### 3. Application Setup

```bash
# Install dependencies
npm install
cd client && npm install
cd ../server && npm install
cd ..

# Disable demo data for production
npm run demo:disable

# Build application
npm run build
```

### 4. Security Configuration

```bash
# Create uploads directory with proper permissions
mkdir uploads
chmod 755 uploads

# Set up log directory
mkdir logs
chmod 755 logs

# Configure firewall (Ubuntu/Debian)
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22  # SSH only from trusted IPs
```

### 5. Start Production Server

```bash
# Start with PM2 (recommended)
npm install -g pm2
pm2 start server/index.js --name "tsoam-production"
pm2 startup
pm2 save

# Or start directly
npm start
```

### 6. SSL Configuration (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔧 Configuration Details

### Database Configuration

**PostgreSQL Setup:**
```sql
-- Create database and user
CREATE DATABASE tsoam_production;
CREATE USER tsoam_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE tsoam_production TO tsoam_user;
```

**MySQL Setup:**
```sql
-- Create database and user
CREATE DATABASE tsoam_production;
CREATE USER 'tsoam_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON tsoam_production.* TO 'tsoam_user'@'localhost';
FLUSH PRIVILEGES;
```

### File Upload Configuration

```bash
# Create secure uploads directory
mkdir -p uploads/documents
mkdir -p uploads/images
mkdir -p uploads/exports

# Set permissions
chmod 755 uploads
chmod 755 uploads/documents
chmod 755 uploads/images
chmod 755 uploads/exports
```

---

## 🛡️ Security Checklist

### Application Security
- [ ] JWT secret is strong (32+ characters)
- [ ] Database passwords are secure
- [ ] SSL/TLS certificates configured
- [ ] File upload restrictions enabled
- [ ] Input validation active
- [ ] SQL injection protection enabled
- [ ] XSS protection configured

### Server Security
- [ ] Firewall configured
- [ ] SSH key authentication only
- [ ] Regular security updates
- [ ] Log monitoring enabled
- [ ] Backup system configured
- [ ] Intrusion detection active

### Database Security
- [ ] Database user has minimal required permissions
- [ ] Database is not accessible from public internet
- [ ] Regular database backups
- [ ] Connection encryption enabled
- [ ] Audit logging active

---

## 📊 Monitoring and Maintenance

### Application Monitoring
```bash
# Check application status
pm2 status

# View logs
pm2 logs tsoam-production

# Monitor system resources
pm2 monit
```

### Database Monitoring
```bash
# Check database status
npm run db:status

# Create backup
npm run db:backup

# Monitor database performance
npm run db:monitor
```

### Log Management
```bash
# Application logs
tail -f logs/application.log

# Error logs
tail -f logs/error.log

# Security logs
tail -f logs/security.log
```

---

## 🔄 Backup and Recovery

### Automated Backup Setup
```bash
# Create backup script
cat > backup-daily.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/tsoam"
mkdir -p $BACKUP_DIR

# Database backup
npm run db:backup > $BACKUP_DIR/db_$DATE.sql

# File backup
tar -czf $BACKUP_DIR/files_$DATE.tar.gz uploads/ logs/

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -type f -mtime +30 -delete
EOF

chmod +x backup-daily.sh

# Add to crontab
echo "0 2 * * * /path/to/backup-daily.sh" | crontab -
```

### Recovery Process
```bash
# Restore database
npm run db:restore backup_file.sql

# Restore files
tar -xzf files_backup.tar.gz

# Restart application
pm2 restart tsoam-production
```

---

## 🚀 Performance Optimization

### Application Optimization
```bash
# Enable production mode
export NODE_ENV=production

# Optimize database connections
# Configure in .env:
DB_POOL_MIN=2
DB_POOL_MAX=10

# Enable caching
REDIS_URL=redis://localhost:6379
```

### Server Optimization
```bash
# Increase file limits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Optimize Node.js
export NODE_OPTIONS="--max-old-space-size=4096"
```

---

## 🔧 Troubleshooting

### Common Issues

**Database Connection Issues:**
```bash
# Check database status
sudo systemctl status postgresql
# or
sudo systemctl status mysql

# Test connection
npm run db:test
```

**Application Won't Start:**
```bash
# Check logs
pm2 logs tsoam-production

# Check port usage
netstat -tulpn | grep :3000

# Restart application
pm2 restart tsoam-production
```

**SSL Issues:**
```bash
# Test SSL certificate
openssl x509 -in /path/to/cert.pem -text -noout

# Check certificate expiry
openssl x509 -in /path/to/cert.pem -enddate -noout
```

### Getting Help

1. Check application logs: `pm2 logs`
2. Check system logs: `tail -f /var/log/syslog`
3. Review database logs
4. Contact system administrator

---

## 📋 Post-Deployment Checklist

### Immediate (Day 1)
- [ ] Application starts successfully
- [ ] Database connection works
- [ ] Admin login functions
- [ ] SSL certificate valid
- [ ] Basic functionality tested
- [ ] Backup system operational

### Week 1
- [ ] All user roles tested
- [ ] Data entry verified
- [ ] Reports generation working
- [ ] Email notifications (if configured)
- [ ] Performance monitoring active
- [ ] Security logs reviewed

### Month 1
- [ ] Regular backups verified
- [ ] Performance optimizations applied
- [ ] User training completed
- [ ] Documentation updated
- [ ] Support procedures established
- [ ] Maintenance schedule created

---

## 📞 Support and Updates

### Getting Updates
```bash
# Check for updates
git fetch origin
git diff HEAD origin/main

# Apply updates (backup first!)
git pull origin main
npm install
npm run build
pm2 restart tsoam-production
```

### Support Contacts
- **Technical Support:** your-admin@church.org
- **System Administrator:** admin@tsoam.org
- **Emergency Contact:** +254 XXX XXX XXX

---

*TSOAM Church Management System - Production Ready*  
*Last Updated: January 2025*
