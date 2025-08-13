# TSOAM System Deployment Checklist

## Pre-Deployment Requirements

### System Requirements
- [ ] Node.js 18.0+ installed
- [ ] MySQL 8.0+ installed and running
- [ ] NPM 8.0+ installed
- [ ] 4GB+ RAM available
- [ ] 10GB+ disk space available

### Security Requirements
- [ ] Firewall configured (ports 3001, 3306)
- [ ] SSL certificate ready (for HTTPS in production)
- [ ] Strong passwords generated for database
- [ ] JWT and session secrets generated
- [ ] Admin email account ready

## Installation Steps

### 1. System Setup
```bash
# Extract system files
unzip tsoam-church-management.zip
cd tsoam-church-management

# Install dependencies
npm run setup
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.production .env

# Edit configuration
nano .env
```

**Required .env Updates:**
- [ ] `DB_PASSWORD` - Set strong MySQL password
- [ ] `JWT_SECRET` - Generate 32+ character secret
- [ ] `SESSION_SECRET` - Generate 32+ character secret
- [ ] `CLIENT_URL` - Set production domain
- [ ] `SMTP_*` - Configure email settings (optional)

### 3. Database Setup
```bash
# Initialize MySQL database
npm run mysql:production
```

**Verify:**
- [ ] Database `tsoam_church_db` created
- [ ] All 13 tables created successfully
- [ ] Admin user `admin@tsoam.org` exists
- [ ] Database indexes optimized

### 4. Build & Start
```bash
# Build production version
npm run build-production

# Start system
npm start
```

### 5. Initial Access
- [ ] Access http://localhost:3001
- [ ] Login with admin@tsoam.org / admin123
- [ ] Change default admin password
- [ ] Create additional user accounts
- [ ] Test all major functions

## Post-Deployment Configuration

### Security Hardening
- [ ] Change default admin password
- [ ] Disable unused user accounts
- [ ] Configure HTTPS/SSL
- [ ] Set up backup procedures
- [ ] Configure log rotation
- [ ] Test disaster recovery

### System Monitoring
- [ ] Set up health check monitoring
- [ ] Configure error alerting
- [ ] Set up database backups
- [ ] Monitor disk space usage
- [ ] Check system logs

### Performance Optimization
- [ ] Configure database connection pooling
- [ ] Set up reverse proxy (nginx/apache)
- [ ] Enable gzip compression
- [ ] Configure caching headers
- [ ] Optimize static file serving

## Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check MySQL service
systemctl status mysql

# Test connection
mysql -u root -p -e "SELECT 1"

# Check configuration
cat .env | grep DB_
```

**Port Already in Use**
```bash
# Check what's using port 3001
sudo netstat -tulpn | grep 3001

# Kill process if needed
sudo kill $(sudo lsof -t -i:3001)
```

**Build Errors**
```bash
# Clear cache and rebuild
rm -rf client/dist
rm -rf node_modules
npm install
npm run build-production
```

### Support Contacts
- Technical Support: [Your contact info]
- Emergency Contact: [Emergency contact]
- Documentation: See `/docs/` folder

## Maintenance Schedule

### Daily
- [ ] Check system logs
- [ ] Monitor disk space
- [ ] Verify backup completion

### Weekly
- [ ] Review user activity logs
- [ ] Check database performance
- [ ] Update security patches

### Monthly
- [ ] Full system backup test
- [ ] Performance optimization review
- [ ] Security audit
- [ ] User access review

## Success Criteria

Deployment is successful when:
- [ ] System accessible via web browser
- [ ] All user roles can login
- [ ] Database operations work correctly
- [ ] File uploads functional
- [ ] Messaging system operational
- [ ] Reports generate correctly
- [ ] No error logs in console
- [ ] System performance acceptable

---

**Deployment Date:** ___________
**Deployed By:** ___________
**Verified By:** ___________
**Next Review:** ___________
