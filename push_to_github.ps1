# PowerShell script to push "Battery Shop Management UI" to GitHub

Write-Host "Checking for Git..." -ForegroundColor Cyan
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Git is not installed or not in your PATH." -ForegroundColor Red
    Write-Host "Please install Git from https://git-scm.com/ and try again." -ForegroundColor Red
    exit
}

# 1. Initialize Git if not already done
if (!(Test-Path .git)) {
    Write-Host "Initializing Git repository..." -ForegroundColor Cyan
    git init
} else {
    Write-Host "Git repository already initialized." -ForegroundColor Green
}

# 2. Add files
Write-Host "Adding files to staging..." -ForegroundColor Cyan
git add .

# 3. Commit
$commitMsg = Read-Host "Enter commit message (default: 'Updated Battery Shop UI implementation')"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "Updated Battery Shop UI implementation"
}
Write-Host "Creating commit..." -ForegroundColor Cyan
git commit -m "$commitMsg"

# 4. Handle remote origin
$repoUrl = "https://github.com/GaneshKarthi2007/Battery-shop.git"
$remotes = git remote
if ($remotes -contains "origin") {
    Write-Host "Remote 'origin' already exists. Updating URL..." -ForegroundColor Cyan
    git remote set-url origin $repoUrl
} else {
    Write-Host "Adding remote origin..." -ForegroundColor Cyan
    git remote add origin $repoUrl
}

# 5. Push
Write-Host "Pushing to main branch..." -ForegroundColor Cyan
git branch -M main
git push -u origin main

Write-Host "`nProject successfully pushed to $repoUrl!" -ForegroundColor Green
