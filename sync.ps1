# Auto-commit and push script for SoloSpot
git add .
$commitMsg = "git: auto-update from Antigravity IDE - " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
git commit -m $commitMsg

# Get current branch name
$branch = git branch --show-current
if ($branch) {
    Write-Host "Wysyłanie gałęzi $branch na serwer..." -ForegroundColor Cyan
    git push -u origin $branch
} else {
    git push
}

Write-Host "Rozpoczynanie bezpośredniego wdrożenia na Vercel..." -ForegroundColor Cyan
npx vercel --prod --yes

Write-Host "Zsynchronizowano i pomyślnie wdrożono na Vercel!" -ForegroundColor Green
