# Script de diagnostico rapido
Write-Host "=== DIAGNOSTICO CORE BANKING ===" -ForegroundColor Cyan

# Verificar Node.js
Write-Host "1. Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Node.js no encontrado" -ForegroundColor Red
    Write-Host "   Instala Node.js desde https://nodejs.org/" -ForegroundColor Red
}

# Verificar npm
Write-Host "2. Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "   npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: npm no encontrado" -ForegroundColor Red
}

# Verificar directorios
Write-Host "3. Verificando estructura..." -ForegroundColor Yellow
if (Test-Path "apps\api") {
    Write-Host "   API: OK" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Directorio apps\api no existe" -ForegroundColor Red
}

if (Test-Path "apps\dashboard") {
    Write-Host "   Dashboard: OK" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Directorio apps\dashboard no existe" -ForegroundColor Red
}

# Verificar dependencias
Write-Host "4. Verificando dependencias..." -ForegroundColor Yellow
if (Test-Path "apps\api\node_modules") {
    Write-Host "   API dependencias: OK" -ForegroundColor Green
} else {
    Write-Host "   API dependencias: FALTAN" -ForegroundColor Red
    Write-Host "   Ejecuta: cd apps\api && npm install" -ForegroundColor Yellow
}

if (Test-Path "apps\dashboard\node_modules") {
    Write-Host "   Dashboard dependencias: OK" -ForegroundColor Green
} else {
    Write-Host "   Dashboard dependencias: FALTAN" -ForegroundColor Red
    Write-Host "   Ejecuta: cd apps\dashboard && npm install" -ForegroundColor Yellow
}

# Verificar puertos
Write-Host "5. Verificando puertos..." -ForegroundColor Yellow
try {
    $connection = New-Object System.Net.Sockets.TcpClient
    $connection.Connect("localhost", 8080)
    $connection.Close()
    Write-Host "   Puerto 8080: EN USO" -ForegroundColor Red
} catch {
    Write-Host "   Puerto 8080: LIBRE" -ForegroundColor Green
}

try {
    $connection = New-Object System.Net.Sockets.TcpClient
    $connection.Connect("localhost", 3000)
    $connection.Close()
    Write-Host "   Puerto 3000: EN USO" -ForegroundColor Red
} catch {
    Write-Host "   Puerto 3000: LIBRE" -ForegroundColor Green
}

# Verificar procesos
Write-Host "6. Verificando procesos..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   Procesos Node.js: $($nodeProcesses.Count) ejecutandose" -ForegroundColor Yellow
    foreach ($proc in $nodeProcesses) {
        Write-Host "     PID: $($proc.Id)" -ForegroundColor Gray
    }
} else {
    Write-Host "   Procesos Node.js: NINGUNO" -ForegroundColor Green
}

# Verificar archivos de configuracion
Write-Host "7. Verificando configuracion..." -ForegroundColor Yellow
if (Test-Path "apps\api\.env") {
    Write-Host "   API .env: OK" -ForegroundColor Green
} else {
    Write-Host "   API .env: FALTA" -ForegroundColor Red
}

if (Test-Path "apps\dashboard\.env.local") {
    Write-Host "   Dashboard .env.local: OK" -ForegroundColor Green
} else {
    Write-Host "   Dashboard .env.local: FALTA" -ForegroundColor Red
}

Write-Host "=== DIAGNOSTICO COMPLETADO ===" -ForegroundColor Cyan
Write-Host "Si hay errores, ejecuta: .\start-simple.ps1" -ForegroundColor Yellow
