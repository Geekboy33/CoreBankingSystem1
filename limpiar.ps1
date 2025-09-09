# Script de limpieza
Write-Host "=== LIMPIEZA DEL SISTEMA ===" -ForegroundColor Cyan

# Detener procesos Node.js
Write-Host "Deteniendo procesos Node.js..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "Procesos Node.js detenidos" -ForegroundColor Green

# Detener procesos npm
Write-Host "Deteniendo procesos npm..." -ForegroundColor Yellow
Get-Process npm -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "Procesos npm detenidos" -ForegroundColor Green

# Limpiar archivos temporales
Write-Host "Limpiando archivos temporales..." -ForegroundColor Yellow
if (Test-Path "apps\api\node_modules\.cache") {
    Remove-Item "apps\api\node_modules\.cache" -Recurse -Force
    Write-Host "Cache de API limpiado" -ForegroundColor Green
}

if (Test-Path "apps\dashboard\.next") {
    Remove-Item "apps\dashboard\.next" -Recurse -Force
    Write-Host "Cache de Dashboard limpiado" -ForegroundColor Green
}

# Verificar puertos
Write-Host "Verificando puertos..." -ForegroundColor Yellow
try {
    $connection = New-Object System.Net.Sockets.TcpClient
    $connection.Connect("localhost", 8080)
    $connection.Close()
    Write-Host "Puerto 8080: AUN EN USO" -ForegroundColor Red
} catch {
    Write-Host "Puerto 8080: LIBRE" -ForegroundColor Green
}

try {
    $connection = New-Object System.Net.Sockets.TcpClient
    $connection.Connect("localhost", 3000)
    $connection.Close()
    Write-Host "Puerto 3000: AUN EN USO" -ForegroundColor Red
} catch {
    Write-Host "Puerto 3000: LIBRE" -ForegroundColor Green
}

Write-Host "=== LIMPIEZA COMPLETADA ===" -ForegroundColor Green
Write-Host "Ahora puedes ejecutar: .\start-simple.ps1" -ForegroundColor Yellow
