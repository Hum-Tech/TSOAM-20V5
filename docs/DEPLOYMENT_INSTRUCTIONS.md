# TSOAM Church Management System - Deployment Instructions

**Complete deployment guide for production environments**

## 📋 Pre-Deployment Checklist

### System Requirements
- [ ] **Server**: Ubuntu 20.04+ or CentOS 8+ (minimum 2GB RAM, 20GB storage)
- [ ] **Node.js**: Version 18.0 or higher
- [ ] **MySQL**: Version 8.0 or higher  
- [ ] **Nginx**: Version 1.18+ (for reverse proxy)
- [ ] **SSL Certificate**: Valid SSL certificate for HTTPS
- [ ] **Domain**: Configured domain name pointing to server

### Prerequisites
- [ ] Root or sudo access to deployment server
- [ ] Database server accessible from application server
- [ ] SMTP server configured for email notifications
- [ ] Backup storage solution configured
- [ ] Monitoring and logging systems ready

## 🚀 Deployment Steps

### Step 1: Server Preparation

1. **Update System Packages**
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt upgrade -y
   
   # CentOS/RHEL
   sudo yum update -y
   ```

2. **Install Required Software**
   ```bash
   # Install Node.js (using NodeSource repository)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install MySQL
   sudo apt install mysql-server mysql-client -y
   
   # Install Nginx
   sudo apt install nginx -y
   
   # Install additional tools
   sudo apt install git curl wget unzip -y
   ```

3. **Create Application User**
   ```bash
   sudo useradd -m -s /bin/bash tsoam
   sudo usermod -aG sudo tsoam
   ```

### Step 2: Database Setup

1. **Secure MySQL Installation**
   ```bash
   sudo mysql_secure_installation
   ```

2. **Create Database and User**
   ```sql
   # Connect to MySQL as root
   sudo mysql -u root -p
   
   # Create database
   CREATE DATABASE tsoam_church CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   
   # Create user with strong password
   CREATE USER 'tsoam_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
   
   # Grant privileges
   GRANT ALL PRIVILEGES ON tsoam_church.* TO 'tsoam_user'@'localhost';
   FLUSH PRIVILEGES;
   
   # Exit MySQL
   EXIT;
   ```

### Step 3: Application Deployment

1. **Upload Application Files**
   ```bash
   # Switch to application user
   sudo su - tsoam
   
   # Create application directory
   mkdir -p /home/tsoam/tsoam-app
   cd /home/tsoam/tsoam-app
   
   # Upload and extract application files
   # (Upload tsoam-church-management-system.zip to server)
   unzip tsoam-church-management-system.zip
   cd tsoam-church-management-system
   ```

2. **Install Dependencies**
   ```bash
   # Install all dependencies
   npm run install-all
   ```

3. **Environment Configuration**
   ```bash
   # Create production environment file
   cp .env.example .env.production
   
   # Edit environment variables
   nano .env.production
   ```

   **Required Environment Variables:**
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=tsoam_user
   DB_PASSWORD=STRONG_PASSWORD_HERE
   DB_NAME=tsoam_church
   
   # Application Configuration
   NODE_ENV=production
   PORT=3002
   
   # Security
   JWT_SECRET=GENERATE_STRONG_SECRET_HERE
   SESSION_SECRET=ANOTHER_STRONG_SECRET_HERE
   
   # Email Configuration (Optional but recommended)
   SMTP_HOST=your-smtp-server.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@domain.com
   SMTP_PASS=your-email-password
   
   # Application URLs
   API_URL=https://yourdomain.com/api
   CLIENT_URL=https://yourdomain.com
   ```

4. **Database Schema Import**
   ```bash
   # Import database schema
   mysql -u tsoam_user -p tsoam_church < database/schema.sql
   
   # Verify database import
   mysql -u tsoam_user -p tsoam_church -e "SHOW TABLES;"
   ```

5. **Clean Demo Data**
   ```bash
   # Remove all demo data before production use
   npm run cleanup-demo-data
   
   # Confirm cleanup completed
   npm run cleanup-demo-data:dry-run
   ```

### Step 4: Build Application

1. **Build Frontend**
   ```bash
   # Build production frontend
   cd client
   npm run build
   cd ..
   ```

2. **Test Application**
   ```bash
   # Test backend API
   cd server
   npm test
   
   # Start application in test mode
   npm run start:test
   ```

### Step 5: Process Management

1. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

2. **Create PM2 Configuration**
   ```bash
   # Create pm2.config.js
   cat > pm2.config.js << 'EOF'
   module.exports = {
     apps: [
       {
         name: 'tsoam-server',
         script: 'server/server.js',
         cwd: '/home/tsoam/tsoam-app/tsoam-church-management-system',
         instances: 1,
         exec_mode: 'cluster',
         env: {
           NODE_ENV: 'production',
           PORT: 3002
         },
         error_file: '/home/tsoam/logs/tsoam-error.log',
         out_file: '/home/tsoam/logs/tsoam-out.log',
         log_file: '/home/tsoam/logs/tsoam-combined.log',
         time: true,
         autorestart: true,
         max_restarts: 10,
         restart_delay: 4000
       }
     ]
   };
   EOF
   ```

3. **Start Application with PM2**
   ```bash
   # Create log directory
   mkdir -p /home/tsoam/logs
   
   # Start application
   pm2 start pm2.config.js
   
   # Setup PM2 to start on system boot
   pm2 startup
   pm2 save
   ```

### Step 6: Nginx Configuration

1. **Create Nginx Site Configuration**
   ```bash
   sudo nano /etc/nginx/sites-available/tsoam
   ```

   **Nginx Configuration:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       # Redirect HTTP to HTTPS
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name yourdomain.com www.yourdomain.com;
       
       # SSL Configuration
       ssl_certificate /path/to/your/certificate.crt;
       ssl_certificate_key /path/to/your/private.key;
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
       ssl_prefer_server_ciphers off;
       
       # Security Headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-XSS-Protection "1; mode=block" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header Referrer-Policy "no-referrer-when-downgrade" always;
       add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
       
       # Frontend Static Files
       location / {
           root /home/tsoam/tsoam-app/tsoam-church-management-system/client/dist;
           try_files $uri $uri/ /index.html;
           
           # Cache static assets
           location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
               expires 1y;
               add_header Cache-Control "public, immutable";
           }
       }
       
       # API Proxy
       location /api {
           proxy_pass http://localhost:3002;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
           
           # Timeouts
           proxy_connect_timeout 60s;
           proxy_send_timeout 60s;
           proxy_read_timeout 60s;
       }
       
       # File Upload Size
       client_max_body_size 50M;
       
       # Gzip Compression
       gzip on;
       gzip_vary on;
       gzip_min_length 1024;
       gzip_types
           application/atom+xml
           application/javascript
           application/json
           application/rss+xml
           application/vnd.ms-fontobject
           application/x-font-ttf
           application/x-web-app-manifest+json
           application/xhtml+xml
           application/xml
           font/opentype
           image/svg+xml
           image/x-icon
           text/css
           text/plain
           text/x-component;
   }
   ```

2. **Enable Site and Test Configuration**
   ```bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/tsoam /etc/nginx/sites-enabled/
   
   # Remove default site
   sudo rm /etc/nginx/sites-enabled/default
   
   # Test configuration
   sudo nginx -t
   
   # Restart Nginx
   sudo systemctl restart nginx
   sudo systemctl enable nginx
   ```

### Step 7: SSL Certificate

1. **Install Certbot (Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   ```

2. **Obtain SSL Certificate**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Setup Auto-Renewal**
   ```bash
   sudo crontab -e
   # Add this line:
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

### Step 8: Firewall Configuration

```bash
# Install UFW if not already installed
sudo apt install ufw -y

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable
```

### Step 9: Monitoring and Logging

1. **Setup Log Rotation**
   ```bash
   sudo nano /etc/logrotate.d/tsoam
   ```

   ```
   /home/tsoam/logs/*.log {
       daily
       missingok
       rotate 52
       compress
       notifempty
       create 644 tsoam tsoam
       postrotate
           pm2 reload tsoam-server
       endscript
   }
   ```

2. **Setup Monitoring**
   ```bash
   # Install monitoring tools
   sudo npm install -g pm2-logrotate
   pm2 install pm2-logrotate
   
   # Configure log monitoring
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 30
   ```

### Step 10: Backup Configuration

1. **Create Backup Script**
   ```bash
   nano /home/tsoam/backup-tsoam.sh
   ```

   ```bash
   #!/bin/bash
   # TSOAM Backup Script
   
   BACKUP_DIR="/home/tsoam/backups"
   DATE=$(date +%Y%m%d_%H%M%S)
   
   # Create backup directory
   mkdir -p $BACKUP_DIR
   
   # Database backup
   mysqldump -u tsoam_user -p tsoam_church > $BACKUP_DIR/database_$DATE.sql
   
   # Application files backup
   tar -czf $BACKUP_DIR/application_$DATE.tar.gz /home/tsoam/tsoam-app
   
   # Remove backups older than 30 days
   find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
   find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
   
   echo "Backup completed: $DATE"
   ```

2. **Schedule Regular Backups**
   ```bash
   chmod +x /home/tsoam/backup-tsoam.sh
   
   # Add to crontab
   crontab -e
   # Add this line for daily backups at 2 AM:
   0 2 * * * /home/tsoam/backup-tsoam.sh
   ```

## 🔒 Security Hardening

### 1. Database Security
- Use strong passwords (minimum 12 characters)
- Limit database user privileges to only necessary permissions
- Enable MySQL slow query log for monitoring
- Regular security updates

### 2. Application Security
- Change all default passwords
- Use strong JWT secrets (minimum 32 characters)
- Enable HTTPS everywhere
- Regular dependency updates
- Input validation on all forms

### 3. Server Security
- Disable root SSH login
- Use SSH keys instead of passwords
- Keep system packages updated
- Configure fail2ban for intrusion prevention
- Regular security monitoring

## 📊 Health Checks

### Application Health Check
```bash
# Check application status
curl -f http://localhost:3002/api/health

# Check database connectivity
mysql -u tsoam_user -p tsoam_church -e "SELECT 1"

# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx
```

### Performance Monitoring
```bash
# Monitor application logs
pm2 logs tsoam-server

# Monitor system resources
htop

# Monitor database
mysql -u tsoam_user -p -e "SHOW PROCESSLIST"
```

## 🆘 Troubleshooting

### Common Issues

1. **Application Won't Start**
   - Check PM2 logs: `pm2 logs tsoam-server`
   - Verify environment variables
   - Check database connectivity
   - Ensure all dependencies are installed

2. **Database Connection Errors**
   - Verify MySQL is running: `sudo systemctl status mysql`
   - Check database credentials
   - Test connection: `mysql -u tsoam_user -p tsoam_church`

3. **Nginx 502 Bad Gateway**
   - Check if backend is running: `curl localhost:3002/api/health`
   - Verify Nginx configuration: `sudo nginx -t`
   - Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

4. **SSL Certificate Issues**
   - Check certificate validity: `sudo certbot certificates`
   - Test SSL configuration: `openssl s_client -connect yourdomain.com:443`

### Getting Help

- **Documentation**: Check `docs/` directory for detailed guides
- **Logs**: Always check application and system logs first
- **Support**: Email support@zionsurf.com for technical assistance

## 📝 Post-Deployment Checklist

- [ ] Application accessible via HTTPS
- [ ] Database properly configured and secured
- [ ] Demo data removed completely
- [ ] SSL certificate installed and auto-renewal configured
- [ ] Backups configured and tested
- [ ] Monitoring and alerting setup
- [ ] Admin user account created with strong password
- [ ] System documentation updated with environment-specific details
- [ ] Performance testing completed
- [ ] Security scan performed

---

**Congratulations! Your TSOAM Church Management System is now deployed and ready for production use.**

For ongoing maintenance and updates, refer to the system documentation and maintain regular backups.

© 2025 ZIONSURF. All rights reserved.
