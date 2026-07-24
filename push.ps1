# Windows PowerShell script to push project to GitHub
$ErrorActionPreference = "Stop"

Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host "🚀 GitHub Push Helper for Dad's Birthday Wish Card" -ForegroundColor Cyan
Write-Host "--------------------------------------------------" -ForegroundColor Cyan

# Prompt for repository link
$repoUrl = Read-Host -Prompt 'Please paste your GitHub Repository URL (e.g., https://github.com/username/repo.git)'

if (-not $repoUrl) {
    Write-Host "❌ Error: No repository URL provided. Aborting." -ForegroundColor Red
    Read-Host -Prompt "Press Enter to close"
    exit
}

try {
    # Check if git is installed
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Error: Git is not installed on your system. Please install Git from https://git-scm.com/ and try again." -ForegroundColor Red
        Read-Host -Prompt "Press Enter to close"
        exit
    }

    Write-Host "`n1. Initializing Git repository..." -ForegroundColor Green
    if (-not (Test-Path .git)) {
        git init
    } else {
        Write-Host "   (Git already initialized)" -ForegroundColor Yellow
    }

    Write-Host "`n2. Staging all files..." -ForegroundColor Green
    git add -A

    Write-Host "`n3. Committing changes..." -ForegroundColor Green
    # Check if there is anything to commit
    $status = git status --porcelain
    if ($status) {
        git commit -m "Initial commit: Interactive 3D Birthday Wish for Dad"
    } else {
        Write-Host "   (No new changes to commit)" -ForegroundColor Yellow
    }

    Write-Host "`n4. Setting default branch to main..." -ForegroundColor Green
    git branch -M main

    Write-Host "`n5. Configuring remote origin..." -ForegroundColor Green
    # Remove existing remote if present
    try {
        git remote remove origin
    } catch {}
    
    git remote add origin $repoUrl.Trim()

    Write-Host "`n6. Pushing code to GitHub main branch..." -ForegroundColor Green
    Write-Host "   (Note: If this is a new repo, it might ask you to log in to GitHub)" -ForegroundColor Yellow
    git push -u origin main -f

    Write-Host "`n✨ Success! Your code is now on GitHub!" -ForegroundColor Green
    Write-Host "Next Step: Go to Vercel.com, import this repository, and click 'Deploy'!" -ForegroundColor Yellow

} catch {
    Write-Host "`n❌ An error occurred during git operations: $_" -ForegroundColor Red
}

Write-Host ""
Read-Host -Prompt "Press Enter to close this helper"
