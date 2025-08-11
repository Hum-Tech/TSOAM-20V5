# TSOAM Church Management System - Database Files

This directory contains the essential database files for the TSOAM Church Management System.

## Files Overview

### 📄 `schema.sql`
**Primary database schema file**
- Contains the complete enterprise database structure with all tables
- Includes 33+ tables for comprehensive church management
- Use this file to create the initial database: `npm run import-schema`
- Compatible with MySQL 8.0+

### ⚡ `optimize_database.sql`
**Database performance optimization**
- Contains indexes and performance optimizations
- Run after importing the main schema: `npm run optimize-db`
- Improves query performance for large datasets
- Includes security configurations

### 🔧 `init_enterprise.js`
**Enterprise initialization script**
- Node.js script for advanced database setup
- Handles enterprise-level configurations
- Run using: `npm run init:enterprise`
- Includes error handling and validation

## Setup Instructions

1. **Create Database:**
   ```bash
   npm run create-db
   ```

2. **Import Schema:**
   ```bash
   npm run import-schema
   ```

3. **Optimize Database:**
   ```bash
   npm run optimize-db
   ```

4. **Initialize Enterprise Features:**
   ```bash
   npm run init:enterprise
   ```

## Database Requirements

- **MySQL**: Version 8.0 or higher
- **Character Set**: UTF8MB4
- **Collation**: utf8mb4_unicode_ci
- **Storage Engine**: InnoDB (default)

## Database Name

Default database name: `tsoam_church_db`

This can be configured in the environment variables if needed.

---

**Note**: This database schema supports the complete TSOAM Church Management System including all modules (Members, Finance, HR, Inventory, Events, Welfare, etc.).
