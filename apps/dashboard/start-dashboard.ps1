# Script para iniciar el dashboard
Set-Location "E:\final AAAA\corebanking\apps\dashboard"
Write-Host "Iniciando Core Banking Dashboard..." -ForegroundColor Green
Write-Host "Directorio: $(Get-Location)" -ForegroundColor Yellow
Write-Host "Verificando package.json..." -ForegroundColor Yellow

if (Test-Path "package.json") {
    Write-Host "package.json encontrado ✓" -ForegroundColor Green
    Write-Host "Ejecutando npm run dev..." -ForegroundColor Yellow
    npm run dev
} else {
    Write-Host "ERROR: package.json no encontrado" -ForegroundColor Red
    Write-Host "Directorio actual: $(Get-Location)" -ForegroundColor Red
    Write-Host "Archivos en directorio:" -ForegroundColor Red
    Get-ChildItem | Select-Object Name, Length
}





