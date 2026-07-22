# Build verification script for SoloSpot
Write-Host "Uruchamianie lokalnego procesu budowania (next build) w celu weryfikacji błędów..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "Kompilacja zakończona sukcesem! Kod jest gotowy do wysłania." -ForegroundColor Green
} else {
    Write-Host "BŁĄD KOMPILACJI! Sprawdź powyższe komunikaty o błędach przed wysłaniem kodu." -ForegroundColor Red
}
