@echo off
echo Deploying backend to Vercel...
cd /d "%~dp0"
call vercel --prod
echo Deployment complete!
pause