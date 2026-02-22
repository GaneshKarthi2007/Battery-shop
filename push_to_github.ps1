# PowerShell script to push "Battery Shop Management UI" to GitHub

Write-Host "Checking for Git..." -ForegroundColor Cyan
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Git is not installed or not in your PATH." -ForegroundColor Red
    Write-Host "Please install Git from https://git-scm.com/ and try again." -ForegroundColor Red
    exit
}

Write-Host "Initializing Git repository..." -ForegroundColor Cyan
git init

Write-Host "Adding files to staging..." -ForegroundColor Cyan
git add .

Write-Host "Creating initial commit..." -ForegroundColor Cyan
git commit -m "Initial commit: Professional Battery Shop UI implementation"

Write-Host "Setting remote origin..." -ForegroundColor Cyan
$repoUrl = "https://github.com/GaneshKarthi2007/Battery-shop.git"
git remote add origin $repoUrl

Write-Host "Pushing to main branch..." -ForegroundColor Cyan
git branch -M main
git push -u origin main

Write-Host "`nProject successfully pushed to $repoUrl!" -ForegroundColor Green
