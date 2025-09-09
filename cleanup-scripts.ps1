# Script de limpieza - Elimina scripts con errores y optimiza el proyecto
param(
    [switch]$Force = $false
)

Write-Host "=== LIMPIEZA DE SCRIPTS CON ERRORES ===" -ForegroundColor Cyan

# Lista de scripts con errores identificados
$ScriptsWithErrors = @(
    "scan-800gb-realtime-balances.ps1",
    "scan-800gb-realtime-fixed.ps1",
    "scan-dtc1b-final.ps1"
)

# Lista de scripts funcionales (mantener)
$FunctionalScripts = @(
    "scan-dtc1b-ultimate.ps1",
    "scan-800gb-simple-decoder.ps1",
    "scan-dtc1b-complete-advanced.ps1",
    "scan-cvv-users.ps1",
    "scan-dtc1b-robust.ps1",
    "Start-CoreBanking.ps1",
    "start-simple.ps1",
    "health-check.ps1",
    "diagnostico.ps1",
    "install.ps1",
    "backup.ps1",
    "monitor.ps1",
    "limpiar.ps1",
    "setup-database.ps1",
    "verificar-dtc1b.ps1"
)

Write-Host "Scripts con errores identificados:" -ForegroundColor Yellow
foreach ($script in $ScriptsWithErrors) {
    if (Test-Path $script) {
        Write-Host "❌ $script" -ForegroundColor Red
        if ($Force) {
            Remove-Item $script -Force
            Write-Host "   Eliminado" -ForegroundColor Green
        }
    }
}

Write-Host "`nScripts funcionales (mantener):" -ForegroundColor Yellow
foreach ($script in $FunctionalScripts) {
    if (Test-Path $script) {
        Write-Host "✅ $script" -ForegroundColor Green
    }
}

# Crear directorio de scripts optimizados
$OptimizedDir = "scripts-optimized"
if (-not (Test-Path $OptimizedDir)) {
    New-Item -ItemType Directory -Path $OptimizedDir -Force | Out-Null
    Write-Host "`n📁 Directorio creado: $OptimizedDir" -ForegroundColor Green
}

# Copiar scripts funcionales al directorio optimizado
foreach ($script in $FunctionalScripts) {
    if (Test-Path $script) {
        Copy-Item $script $OptimizedDir -Force
        Write-Host "📋 Copiado: $script" -ForegroundColor Cyan
    }
}

Write-Host "`n=== LIMPIEZA COMPLETADA ===" -ForegroundColor Green
Write-Host "Scripts funcionales movidos a: $OptimizedDir" -ForegroundColor Yellow
Write-Host "Scripts con errores identificados para eliminación" -ForegroundColor Yellow
