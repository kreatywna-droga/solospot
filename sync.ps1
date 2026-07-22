# Auto-commit and push script for SoloSpot
git add .
$commitMsg = "git: auto-update from Antigravity IDE - " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
git commit -m $commitMsg
git push
Write-Host "Zsynchronizowano i wysłano na Vercel!" -ForegroundColor Green
