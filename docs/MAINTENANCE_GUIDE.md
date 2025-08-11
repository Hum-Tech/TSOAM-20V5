# TSOAM Church Management System - Maintenance Guide

**Complete guide for system maintenance, updates, and troubleshooting**

## 📅 Regular Maintenance Schedule

### Daily Tasks (Automated)
- [ ] **Database Backups**: Automated daily backups at 2 AM
- [ ] **Log Rotation**: Application and system logs rotated
- [ ] **Health Checks**: Automated monitoring alerts
- [ ] **SSL Certificate Check**: Automated renewal monitoring

### Weekly Tasks
- [ ] **System Updates**: Check for security updates
- [ ] **Performance Review**: Monitor system performance metrics
- [ ] **Backup Verification**: Test backup restoration process
- [ ] **User Activity Review**: Monitor user access patterns
- [ ] **Error Log Analysis**: Review and address application errors

### Monthly Tasks
- [ ] **Full System Backup**: Complete system and data backup
- [ ] **Security Audit**: Review user accounts and permissions
- [ ] **Performance Optimization**: Database optimization and cleanup
- [ ] **Dependency Updates**: Update Node.js packages and dependencies
- [ ] **Documentation Review**: Update system documentation

### Quarterly Tasks
- [ ] **Security Assessment**: Comprehensive security review
- [ ] **Disaster Recovery Test**: Test full system restoration
- [ ] **Performance Analysis**: Detailed performance review and optimization
- [ ] **User Training**: Admin user training on new features
- [ ] **System Capacity Planning**: Review and plan for growth

## 🔧 System Updates

### Application Updates

1. **Backup Before Updates**
   ```bash
   # Create full backup
   /home/tsoam/backup-tsoam.sh
   
   # Verify backup integrity
   mysql -u tsoam_user -p tsoam_church < /home/tsoam/backups/database_latest.sql --dry-run
   ```

2. **Update Application Code**
   ```bash
   # Switch to application user
   sudo su - tsoam
   cd /home/tsoam/tsoam-app/tsoam-church-management-system
   
   # Create update backup
   tar -czf ../backup-before-update-$(date +%Y%m%d).tar.gz .
   
   # Pull updates (if using git)
   git pull origin main
   
   # Or replace files with new release package
   # Extract new version over existing files
   ```

3. **Update Dependencies**
   ```bash
   # Update backend dependencies
   cd server
   npm update
   npm audit fix
   
   # Update frontend dependencies
   cd ../client
   npm update
   npm audit fix
   ```

4. **Run Database Migrations**
   ```bash
   # Apply any database schema changes
   cd ..
   node scripts/migrate-database.js
   ```

5. **Rebuild and Restart**
   ```bash
   # Rebuild frontend
   cd client
   npm run build
   
   # Restart application
   pm2 reload tsoam-server
   
   # Verify application is running
   pm2 status
   curl -f http://localhost:3002/api/health
   ```

### System Updates

1. **Update Operating System**
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt upgrade -y
   
   # CentOS/RHEL
   sudo yum update -y
   
   # Reboot if kernel updates were installed
   sudo reboot
   ```

2. **Update Node.js**
   ```bash
   # Check current version
   node --version
   
   # Update Node.js (using NodeSource)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Restart application after Node.js update
   pm2 reload tsoam-server
   ```

3. **Update MySQL**
   ```bash
   # Backup database before update
   mysqldump -u tsoam_user -p tsoam_church > backup-before-mysql-update.sql
   
   # Update MySQL
   sudo apt update mysql-server
   
   # Check MySQL status
   sudo systemctl status mysql
   ```

## 🗃️ Database Maintenance

### Daily Database Tasks

1. **Backup Verification**
   ```bash
   # Check if backup was created
   ls -la /home/tsoam/backups/database_$(date +%Y%m%d)*.sql
   
   # Test backup integrity
   mysql -u tsoam_user -p --execute="SELECT 1" tsoam_church
   ```

### Weekly Database Tasks

1. **Database Optimization**
   ```sql
   -- Connect to database
   mysql -u tsoam_user -p tsoam_church
   
   -- Optimize tables
   OPTIMIZE TABLE appointments;
   OPTIMIZE TABLE members;
   OPTIMIZE TABLE financial_transactions;
   OPTIMIZE TABLE inventory_items;
   OPTIMIZE TABLE events;
   OPTIMIZE TABLE employees;
   OPTIMIZE TABLE welfare_applications;
   
   -- Check table status
   CHECK TABLE appointments;
   CHECK TABLE members;
   
   -- Analyze tables for query optimization
   ANALYZE TABLE appointments;
   ANALYZE TABLE members;
   ```

2. **Database Cleanup**
   ```sql
   -- Remove old session data (older than 30 days)
   DELETE FROM user_sessions WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
   
   -- Remove old audit logs (older than 1 year)
   DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
   
   -- Remove expired password reset tokens
   DELETE FROM password_resets WHERE expires_at < NOW();
   ```

### Monthly Database Tasks

1. **Database Size Monitoring**
   ```sql
   -- Check database size
   SELECT 
       table_schema AS 'Database',
       ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
   FROM information_schema.tables 
   WHERE table_schema = 'tsoam_church';
   
   -- Check individual table sizes
   SELECT 
       table_name AS 'Table',
       ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
   FROM information_schema.TABLES 
   WHERE table_schema = 'tsoam_church'
   ORDER BY (data_length + index_length) DESC;
   ```

2. **Index Optimization**
   ```sql
   -- Check for unused indexes
   SELECT 
       s.schema_name,
       s.table_name,
       s.index_name,
       s.rows_examined,
       s.rows_sent
   FROM performance_schema.table_io_waits_summary_by_index_usage s
   WHERE s.schema_name = 'tsoam_church'
   AND s.index_name IS NOT NULL
   AND s.count_star = 0;
   
   -- Check slow queries
   SELECT 
       schema_name,
       digest_text,
       count_star,
       avg_timer_wait,
       sum_timer_wait
   FROM performance_schema.events_statements_summary_by_digest
   WHERE schema_name = 'tsoam_church'
   ORDER BY avg_timer_wait DESC
   LIMIT 10;
   ```

## 📊 Performance Monitoring

### Application Performance

1. **Monitor Application Metrics**
   ```bash
   # Check PM2 status and metrics
   pm2 status
   pm2 monit
   
   # Check memory usage
   pm2 show tsoam-server
   
   # Monitor real-time logs
   pm2 logs tsoam-server --lines 100
   ```

2. **Monitor System Resources**
   ```bash
   # Check system load
   uptime
   
   # Check memory usage
   free -h
   
   # Check disk usage
   df -h
   
   # Check running processes
   htop
   ```

3. **Database Performance Monitoring**
   ```sql
   -- Check current connections
   SHOW PROCESSLIST;
   
   -- Check database status
   SHOW STATUS LIKE 'Threads_connected';
   SHOW STATUS LIKE 'Questions';
   SHOW STATUS LIKE 'Uptime';
   
   -- Check slow queries
   SHOW VARIABLES LIKE 'slow_query_log';
   SHOW VARIABLES LIKE 'long_query_time';
   ```

### Performance Optimization

1. **Application Optimization**
   ```bash
   # Clear application cache
   pm2 flush tsoam-server
   
   # Restart application to free memory
   pm2 reload tsoam-server
   
   # Update Node.js modules for performance
   cd /home/tsoam/tsoam-app/tsoam-church-management-system
   npm update
   ```

2. **Database Optimization**
   ```sql
   -- Update table statistics
   ANALYZE TABLE appointments, members, financial_transactions;
   
   -- Optimize tables
   OPTIMIZE TABLE appointments, members, financial_transactions;
   
   -- Check for table fragmentation
   SELECT 
       table_name,
       data_free,
       ROUND(data_free/1024/1024,2) AS data_free_MB
   FROM information_schema.tables
   WHERE table_schema = 'tsoam_church'
   AND data_free > 0;
   ```

## 🔐 Security Maintenance

### Regular Security Tasks

1. **User Account Review**
   ```bash
   # Review user accounts in database
   mysql -u tsoam_user -p tsoam_church -e "
   SELECT 
       id, username, email, role, 
       last_login, created_at, is_active
   FROM users 
   ORDER BY last_login DESC;"
   
   # Check for inactive users (no login in 90 days)
   mysql -u tsoam_user -p tsoam_church -e "
   SELECT username, email, last_login 
   FROM users 
   WHERE last_login < DATE_SUB(NOW(), INTERVAL 90 DAY)
   AND is_active = 1;"
   ```

2. **Password Policy Enforcement**
   ```bash
   # Check for users with old passwords (older than 90 days)
   mysql -u tsoam_user -p tsoam_church -e "
   SELECT username, email, password_changed_at
   FROM users 
   WHERE password_changed_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
   OR password_changed_at IS NULL;"
   ```

3. **Security Log Review**
   ```bash
   # Check authentication logs
   tail -100 /var/log/auth.log | grep -i "failed"
   
   # Check application security logs
   grep -i "unauthorized\|failed\|error" /home/tsoam/logs/tsoam-combined.log
   
   # Check for suspicious database activity
   mysql -u tsoam_user -p tsoam_church -e "
   SELECT * FROM audit_logs 
   WHERE action LIKE '%DELETE%' OR action LIKE '%DROP%'
   ORDER BY created_at DESC 
   LIMIT 20;"
   ```

### Security Updates

1. **System Security Updates**
   ```bash
   # Check for security updates
   sudo apt list --upgradable | grep -i security
   
   # Install security updates
   sudo apt upgrade
   
   # Check for vulnerabilities
   sudo apt install lynis
   sudo lynis audit system
   ```

2. **Application Security Updates**
   ```bash
   # Check for vulnerable dependencies
   cd /home/tsoam/tsoam-app/tsoam-church-management-system
   
   # Backend security audit
   cd server && npm audit
   npm audit fix
   
   # Frontend security audit
   cd ../client && npm audit
   npm audit fix
   ```

## 🚨 Troubleshooting Common Issues

### Application Issues

1. **Application Won't Start**
   ```bash
   # Check PM2 status
   pm2 status
   
   # Check logs for errors
   pm2 logs tsoam-server --err
   
   # Check if port is in use
   sudo netstat -tulpn | grep :3002
   
   # Restart application
   pm2 restart tsoam-server
   ```

2. **High Memory Usage**
   ```bash
   # Check memory usage
   pm2 show tsoam-server
   
   # Restart application to free memory
   pm2 reload tsoam-server
   
   # Check for memory leaks
   pm2 logs tsoam-server | grep -i "memory\|heap"
   ```

3. **Database Connection Issues**
   ```bash
   # Test database connection
   mysql -u tsoam_user -p tsoam_church -e "SELECT 1"
   
   # Check database status
   sudo systemctl status mysql
   
   # Check database logs
   sudo tail -f /var/log/mysql/error.log
   
   # Restart database if needed
   sudo systemctl restart mysql
   ```

### Performance Issues

1. **Slow Application Response**
   ```bash
   # Check system load
   uptime
   
   # Check database performance
   mysql -u tsoam_user -p tsoam_church -e "SHOW PROCESSLIST"
   
   # Check slow queries
   mysql -u tsoam_user -p tsoam_church -e "
   SELECT * FROM mysql.slow_log 
   ORDER BY start_time DESC 
   LIMIT 10"
   ```

2. **High Database Load**
   ```sql
   -- Check current queries
   SHOW PROCESSLIST;
   
   -- Check for locked tables
   SHOW OPEN TABLES WHERE In_use > 0;
   
   -- Kill problematic queries (if identified)
   -- KILL [query_id];
   ```

### Network Issues

1. **SSL Certificate Problems**
   ```bash
   # Check certificate status
   sudo certbot certificates
   
   # Test SSL configuration
   openssl s_client -connect yourdomain.com:443
   
   # Renew certificate if needed
   sudo certbot renew
   ```

2. **Nginx Issues**
   ```bash
   # Test Nginx configuration
   sudo nginx -t
   
   # Check Nginx status
   sudo systemctl status nginx
   
   # Check Nginx logs
   sudo tail -f /var/log/nginx/error.log
   
   # Restart Nginx
   sudo systemctl restart nginx
   ```

## 📋 Maintenance Checklists

### Weekly Maintenance Checklist
- [ ] Review application logs for errors
- [ ] Check system resource usage
- [ ] Verify backup completion
- [ ] Test application functionality
- [ ] Review user activity
- [ ] Check for security alerts
- [ ] Monitor database performance
- [ ] Verify SSL certificate status

### Monthly Maintenance Checklist
- [ ] Update system packages
- [ ] Update application dependencies
- [ ] Optimize database tables
- [ ] Review and clean old logs
- [ ] Test backup restoration
- [ ] Security audit
- [ ] Performance review
- [ ] Update documentation

### Emergency Procedures

1. **System Down Procedure**
   ```bash
   # Check all services
   pm2 status
   sudo systemctl status nginx
   sudo systemctl status mysql
   
   # Restart services in order
   sudo systemctl restart mysql
   pm2 restart tsoam-server
   sudo systemctl restart nginx
   
   # Verify system is working
   curl -f https://yourdomain.com/api/health
   ```

2. **Data Recovery Procedure**
   ```bash
   # Stop application
   pm2 stop tsoam-server
   
   # Restore from latest backup
   mysql -u tsoam_user -p tsoam_church < /home/tsoam/backups/database_latest.sql
   
   # Restart application
   pm2 start tsoam-server
   
   # Verify data integrity
   mysql -u tsoam_user -p tsoam_church -e "SELECT COUNT(*) FROM members"
   ```

## 📞 Support Contacts

### Technical Support
- **Email**: support@zionsurf.com
- **Emergency**: Include "URGENT" in subject line
- **Documentation**: Check `docs/` directory first

### Escalation Procedures
1. Check logs and documentation
2. Attempt basic troubleshooting
3. Contact technical support with:
   - Error messages
   - Steps to reproduce
   - System information
   - Recent changes made

---

**Regular maintenance ensures optimal performance, security, and reliability of your TSOAM Church Management System.**

© 2025 ZIONSURF. All rights reserved.
