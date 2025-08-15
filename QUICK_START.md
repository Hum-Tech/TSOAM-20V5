# TSOAM Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### For the Issue You're Experiencing:

The error `'vite' is not recognized as an internal or external command` means the client dependencies aren't installed.

### ✅ **Immediate Fix:**

```cmd
# Step 1: Install client dependencies
cd client
npm install

# Step 2: Go back to root and build
cd ..
npm run build

# Step 3: Start the system
npm start
```

### ✅ **Complete Fresh Setup:**

```cmd
# Method 1: Use the Windows setup script
setup-windows.bat

# Method 2: Manual complete setup
npm run install-all
npm run build
npm start
```

### ✅ **What Each Command Does:**

1. **`npm install`** (root) - Installs server dependencies only
2. **`cd client && npm install`** - Installs frontend dependencies (includes Vite)
3. **`npm run build`** - Builds the React frontend using Vite
4. **`npm start`** - Starts the production server

### ✅ **Folder Structure Dependencies:**

```
TSOAMV11/
├── package.json          # Root dependencies (MySQL, bcrypt, etc.)
├── client/
│   └── package.json      # Frontend dependencies (React, Vite, etc.)
└── server/
    └── package.json      # Server dependencies (Express, etc.)
```

Each folder needs its own `npm install`!

### ✅ **Quick Setup Commands:**

```cmd
# Install everything at once
npm run install-all

# Check if build works
npm run build

# Start MySQL (XAMPP/WAMP)
# Then initialize database
npm run mysql:check
npm run db:init

# Start the system
npm start
```

### ✅ **Access the System:**

1. **URL:** http://localhost:3001
2. **Login:** admin@tsoam.org / admin123

### ✅ **Troubleshooting:**

**If `npm run install-all` fails:**
```cmd
npm install
cd client
npm install
cd ../server  
npm install
cd ..
```

**If build still fails:**
```cmd
cd client
npm install --force
npm run build-only
cd ..
```

**If server won't start:**
```cmd
# Make sure MySQL is running first
npm run mysql:check
# Then try starting again
npm start
```

---

**That's it! Your TSOAM system should now be running perfectly! 🎉**
