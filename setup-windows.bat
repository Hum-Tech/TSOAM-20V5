@echo off
echo 🚀 TSOAM Church Management System - Windows Setup
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📦 Step 1: Installing all dependencies...
echo.

echo Installing root dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to install root dependencies
    pause
    exit /b %ERRORLEVEL%
)

echo Installing client dependencies...
cd client
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to install client dependencies
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo Installing server dependencies...
cd server
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to install server dependencies
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo ✅ All dependencies installed successfully!
echo.
echo 🏗️ Step 2: Building the application...
echo.

cd client
call npm run build-only
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to build client application
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo ✅ Build completed successfully!
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🎉 Setup completed successfully!
echo.
echo 🔧 Next steps:
echo    1. Ensure MySQL is running (XAMPP, WAMP, etc.)
echo    2. Run: npm run mysql:check
echo    3. Run: npm run db:init
echo    4. Run: npm start
echo    5. Open: http://localhost:3001
echo    6. Login: admin@tsoam.org / admin123
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
pause
