# Windows PowerShell script to push project to GitHub
$ErrorActionPreference = "Stop"

Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host "🚀 GitHub Push Helper for Dad's Birthday Wish Card" -ForegroundColor Cyan
Write-Host "--------------------------------------------------" -ForegroundColor Cyan

# Hardcoded repository URL to avoid pasting issues
$repoUrl = "https://github.com/satyacharan1189121/DAD-BIRTHDAY.git"
Write-Host "Configured Repository: $repoUrl" -ForegroundColor Yellow

try {
    # Check if git is installed
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Error: Git is not installed on your system. Please install Git from https://git-scm.com/ and try again." -ForegroundColor Red
        Read-Host -Prompt "Press Enter to close"
        exit
    }

    # Check if music.mp3 is already downloaded
    if (-not (Test-Path "music.mp3")) {
        Write-Host "`nDownloading high-quality background music..." -ForegroundColor Green
        try {
            Invoke-WebRequest -Uri "https://www.chosic.com/wp-content/uploads/2021/09/Happy-Birthday-To-You-Piano-Version.mp3" -OutFile "music.mp3" -UserAgent "Mozilla/5.0"
            Write-Host "   (Music downloaded successfully!)" -ForegroundColor Yellow
        } catch {
            Write-Host "   (Warning: Could not download music. You can download and place a 'music.mp3' manually.)" -ForegroundColor Red
        }
    } else {
        Write-Host "`nBackground music 'music.mp3' already present." -ForegroundColor Yellow
    }

    # Copy user-attached images from IDE brain folder to workspace
    Write-Host "`nSyncing user-attached photos..." -ForegroundColor Green
    $brainDir = "C:\Users\Sathya\.gemini\antigravity-ide\brain\28cee689-2b25-475e-8cd3-443f84a6572e"
    $img1 = Join-Path $brainDir ".tempmediaStorage\media_28cee689-2b25-475e-8cd3-443f84a6572e_1784859962836.jpg"
    $img2 = Join-Path $brainDir "media__1784863123701.jpg"
    $img3 = Join-Path $brainDir "media__1784863132210.jpg"
    $img4 = Join-Path $brainDir "media__1784863144287.jpg"

    if (Test-Path $img1) { Copy-Item $img1 "photo1.jpg" -Force; Write-Host "   (photo1.jpg synced)" -ForegroundColor Yellow }
    if (Test-Path $img2) { Copy-Item $img2 "photo2.jpg" -Force; Write-Host "   (photo2.jpg synced)" -ForegroundColor Yellow }
    if (Test-Path $img3) { Copy-Item $img3 "photo3.jpg" -Force; Write-Host "   (photo3.jpg synced)" -ForegroundColor Yellow }
    if (Test-Path $img4) { Copy-Item $img4 "photo4.jpg" -Force; Write-Host "   (photo4.jpg synced)" -ForegroundColor Yellow }

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
