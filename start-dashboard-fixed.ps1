# Script para iniciar el dashboard desde cualquier ubicación
Write-Host "=== INICIANDO CORE BANKING DASHBOARD ===" -ForegroundColor Cyan

# Cambiar al directorio del dashboard
$dashboardPath = "E:\final AAAA\corebanking\apps\dashboard"
Write-Host "Cambiando a directorio: $dashboardPath" -ForegroundColor Yellow

# Verificar que el directorio existe
if (Test-Path $dashboardPath) {
    Set-Location $dashboardPath
    Write-Host "Directorio cambiado exitosamente" -ForegroundColor Green
    Write-Host "Directorio actual: $(Get-Location)" -ForegroundColor Green
    
    # Verificar package.json
    if (Test-Path "package.json") {
        Write-Host "package.json encontrado ✓" -ForegroundColor Green
        Write-Host "Iniciando dashboard..." -ForegroundColor Yellow
        
        # Ejecutar npm run dev
        npm run dev
    } else {
        Write-Host "ERROR: package.json no encontrado en $dashboardPath" -ForegroundColor Red
        Write-Host "Archivos en directorio:" -ForegroundColor Red
        Get-ChildItem | Select-Object Name, Length
    }
} else {
    Write-Host "ERROR: Directorio $dashboardPath no existe" -ForegroundColor Red
    Write-Host "Directorios disponibles en E:\final AAAA\corebanking:" -ForegroundColor Red
    Get-ChildItem "E:\final AAAA\corebanking" | Select-Object Name, Mode
}





