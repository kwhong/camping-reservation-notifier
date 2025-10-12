@echo off
REM Sync documentation to GitHub Wiki (Windows)
REM Usage: sync-wiki.bat

echo 🚀 Starting Wiki sync...

REM Check if Wiki is enabled
git ls-remote https://github.com/kwhong/camping-reservation-notifier.wiki.git >nul 2>&1
if errorlevel 1 (
    echo ❌ Wiki is not enabled for this repository.
    echo.
    echo To enable Wiki:
    echo 1. Go to https://github.com/kwhong/camping-reservation-notifier/settings
    echo 2. Check 'Wikis' under Features section
    echo 3. Create the first page on the Wiki tab
    echo 4. Run this script again
    exit /b 1
)

REM Clone Wiki repository
echo 📥 Cloning Wiki repository...
if exist wiki-temp rmdir /s /q wiki-temp
git clone https://github.com/kwhong/camping-reservation-notifier.wiki.git wiki-temp
cd wiki-temp

REM Copy documentation files
echo 📄 Copying documentation files...
copy ..\GETTING_STARTED.md Getting-Started.md >nul
copy ..\docs\USER_MANUAL.md User-Manual.md >nul
copy ..\docs\OPERATOR_MANUAL.md Operator-Manual.md >nul
copy ..\docs\DEPLOYMENT_GUIDE.md Deployment-Guide.md >nul
copy ..\docs\EXTERNAL_ACCESS_GUIDE.md External-Access.md >nul
copy ..\docs\API_CLIENT_GENERATION.md API-Client-Generation.md >nul
copy ..\docs\TESTING_GUIDE.md Testing-Guide.md >nul
copy ..\docs\SYSTEM_HEALTH_CHECK.md System-Health-Check.md >nul
copy ..\docs\IMPROVEMENT_PLAN.md Improvement-Plan.md >nul
copy ..\docs\FINAL_REPORT.md Final-Report.md >nul
copy ..\docs\SECURITY_PATCH_v1.0.md Security-Patch.md >nul

REM Note: Home.md, API-Documentation.md, Troubleshooting.md, FAQ.md
REM should be created manually or using the Linux script

REM Commit and push
echo 💾 Committing changes...
git add .
git commit -m "docs: Sync documentation to Wiki"

echo 📤 Pushing to GitHub...
git push origin master

REM Cleanup
cd ..
rmdir /s /q wiki-temp

echo ✅ Wiki sync completed successfully!
echo.
echo 📝 View your Wiki at:
echo    https://github.com/kwhong/camping-reservation-notifier/wiki

pause
