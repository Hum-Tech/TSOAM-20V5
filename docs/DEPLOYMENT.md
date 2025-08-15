# TSOAM Deployment Guide

## Production Deployment Options

### 1. Local Server Deployment

#### Requirements
- Ubuntu 20.04+ / Windows Server 2019+ / CentOS 8+
- Node.js 18+
- MySQL 8.0+
- Nginx (recommended)
- PM2 process manager

#### Steps

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install MySQL
   sudo apt install mysql-server -y
   sudo mysql_secure_installation
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx -y
   ```

2. **Application Deployment**
   ```bash
   # Clone/upload application
   cd /opt
   sudo mkdir tsoam
   sudo chown $USER:$USER tsoam
   cd tsoam
   # Upload/extract your TSOAM files here
   
   # Install dependencies
   npm run install-deps
   
   # Configure environment
   cp .env.example .env
   nano .env  # Edit with production values
   
   # Initialize database
   npm run db:init
   
   # Build application
   npm run build
   ```

3. **Process Management with PM2**
   ```bash
   # Create PM2 ecosystem file
   cat > ecosystem.config.js << 'EOF'
   module.exports = {
     apps: [{
       name: 'tsoam-church',
       script: 'server/server.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3002
       },
       error_file: './logs/err.log',
       out_file: './logs/out.log',
       log_file: './logs/combined.log',
       time: true
     }]
   };
   EOF
   
   # Create logs directory
   mkdir logs
   
   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

4. **Nginx Configuration**
   ```bash
   # Create Nginx config
   sudo cat > /etc/nginx/sites-available/tsoam << 'EOF'
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3002;
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
   EOF
   
   # Enable site
   sudo ln -s /etc/nginx/sites-available/tsoam /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 2. Cloud Deployment (DigitalOcean/AWS/Azure)

#### DigitalOcean Droplet
1. Create Ubuntu 20.04 droplet (2GB RAM minimum)
2. Follow local server deployment steps
3. Configure firewall for ports 80, 443, 22
4. Set up SSL with Let's Encrypt

#### AWS EC2
1. Launch EC2 instance (t3.small or larger)
2. Configure security groups
3. Follow deployment steps
4. Use RDS for MySQL (recommended)

#### Azure App Service
1. Create Node.js app service
2. Use Azure Database for MySQL
3. Deploy via Git or ZIP

### 3. Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --only=production
RUN cd client && npm ci --only=production
RUN cd server && npm ci --only=production

# Copy application code
COPY . .

# Build client
RUN cd client && npm run build

EXPOSE 3002

CMD ["node", "server/server.js"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_USER=tsoam
      - DB_PASSWORD=secure_password
      - DB_NAME=tsoam_church_db
    depends_on:
      - mysql
    volumes:
      - uploads:/app/server/uploads

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=tsoam_church_db
      - MYSQL_USER=tsoam
      - MYSQL_PASSWORD=secure_password
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

volumes:
  mysql_data:
  uploads:
```

## Security Configuration

### 1. Environment Variables
```bash
# Production .env
NODE_ENV=production
PORT=3002

# Database (use strong passwords)
DB_HOST=localhost
DB_PORT=3306
DB_USER=tsoam_user
DB_PASSWORD=your_secure_password
DB_NAME=tsoam_church_db

# JWT (generate strong secret)
JWT_SECRET=your_very_long_random_jwt_secret_key
SESSION_SECRET=your_very_long_random_session_secret

# Email
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

### 2. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Firewall Configuration
```bash
# UFW setup
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Backup Strategy

### 1. Database Backups
```bash
# Create backup script
cat > /opt/tsoam/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p tsoam_church_db > /backup/tsoam_backup_$DATE.sql
find /backup -name "tsoam_backup_*.sql" -mtime +7 -delete
EOF

chmod +x /opt/tsoam/backup.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /opt/tsoam/backup.sh
```

### 2. File Backups
```bash
# Backup uploads and logs
tar -czf /backup/tsoam_files_$(date +%Y%m%d).tar.gz /opt/tsoam/server/uploads /opt/tsoam/logs
```

## Monitoring

### 1. PM2 Monitoring
```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs tsoam-church

# Restart if needed
pm2 restart tsoam-church
```

### 2. System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Check system resources
htop
df -h
free -h
```

## Maintenance

### 1. Updates
```bash
# Update application
cd /opt/tsoam
git pull  # or upload new files
npm run install-deps
npm run build
pm2 restart tsoam-church
```

### 2. Database Maintenance
```bash
# Optimize database monthly
mysql -u root -p -e "OPTIMIZE TABLE tsoam_church_db.*;"
```

### 3. Log Rotation
```bash
# Configure log rotation
sudo cat > /etc/logrotate.d/tsoam << 'EOF'
/opt/tsoam/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        pm2 reload tsoam-church
    endscript
}
EOF
```

## Troubleshooting

### Common Issues
1. **PM2 process crashes**: Check logs with `pm2 logs`
2. **Database connection issues**: Verify MySQL is running and credentials
3. **High memory usage**: Increase server RAM or optimize queries
4. **Slow performance**: Check database indexes and query optimization

### Support
- Check application logs in `/opt/tsoam/logs/`
- Monitor system resources
- Contact support: admin@tsoam.org
