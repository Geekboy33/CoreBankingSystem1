# Script de inicio simplificado
param(
    [int]$ApiPort = 8080,
    [int]$DashPort = 3000
)

Write-Host "=== INICIANDO CORE BANKING ===" -ForegroundColor Cyan

# Detener procesos anteriores
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Crear archivos de configuracion si no existen
$ApiEnvFile = "apps\api\.env"
if (-not (Test-Path $ApiEnvFile)) {
    @"
DB_HOST=localhost
DB_PORT=5432
DB_USER=core
DB_PASS=corepass
DB_NAME=corebank
PORT=$ApiPort
NODE_ENV=development
"@ | Out-File -Encoding utf8 $ApiEnvFile
    Write-Host "Creado archivo de configuracion de API" -ForegroundColor Green
}

$DashEnvFile = "apps\dashboard\.env.local"
if (-not (Test-Path $DashEnvFile)) {
    @"
NEXT_PUBLIC_API_BASE=http://localhost:$ApiPort
NEXT_PUBLIC_WS_URL=ws://localhost:$ApiPort/ws
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_NAME=Core Banking Dashboard
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
"@ | Out-File -Encoding utf8 $DashEnvFile
    Write-Host "Creado archivo de configuracion del Dashboard" -ForegroundColor Green
}

# Instalar dependencias
Write-Host "Instalando dependencias..." -ForegroundColor Yellow
cd apps\api
npm install
cd ..\dashboard
npm install
cd ..\..

# Iniciar API
Write-Host "Iniciando API en puerto $ApiPort..." -ForegroundColor Yellow
$env:PORT = $ApiPort
Start-Process powershell.exe -WorkingDirectory "apps\api" -ArgumentList @("-NoExit", "-Command", "npm run dev")

# Esperar un poco
Start-Sleep -Seconds 3

# Iniciar Dashboard
Write-Host "Iniciando Dashboard en puerto $DashPort..." -ForegroundColor Yellow
Start-Process powershell.exe -WorkingDirectory "apps\dashboard" -ArgumentList @("-NoExit", "-Command", "npm run dev")

# Esperar un poco
Start-Sleep -Seconds 3

# Verificar servicios
Write-Host "Verificando servicios..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:$ApiPort/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "API OK: http://localhost:$ApiPort" -ForegroundColor Green
} catch {
    Write-Host "API no responde en puerto $ApiPort" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:$DashPort" -TimeoutSec 5 -UseBasicParsing
    Write-Host "Dashboard OK: http://localhost:$DashPort" -ForegroundColor Green
    Start-Process "http://localhost:$DashPort"
} catch {
    Write-Host "Dashboard no responde en puerto $DashPort" -ForegroundColor Red
}

Write-Host "=== SISTEMA INICIADO ===" -ForegroundColor Green
