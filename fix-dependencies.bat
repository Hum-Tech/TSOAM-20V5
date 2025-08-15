@echo off
echo 🔧 TSOAM Quick Dependency Fix
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo 📦 Installing root dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Root installation failed
) else (
    echo ✅ Root dependencies installed
)

echo.
echo 📦 Installing server dependencies...
cd server
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Server installation failed
) else (
    echo ✅ Server dependencies installed
)
cd ..

echo.
echo 📦 Installing client dependencies...
cd client
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Client installation failed
) else (
    echo ✅ Client dependencies installed
)
cd ..

echo.
echo 🎯 Testing the fix...
echo 📋 Building the application...
call npm run build

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✅ Dependency fix completed!
echo.
echo 🚀 Next steps:
echo    1. Ensure MySQL/XAMPP is running
echo    2. Run: npm run mysql:check
echo    3. Run: npm run db:init
echo    4. Run: npm start
echo.
pause
