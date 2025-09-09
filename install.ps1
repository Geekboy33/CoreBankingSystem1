# Script de instalacion automatica
Write-Host "=== INSTALACION AUTOMATICA CORE BANKING ===" -ForegroundColor Cyan

# Verificar si Node.js esta instalado
Write-Host "1. Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   Node.js no encontrado. Instalando..." -ForegroundColor Red
    
    # Descargar e instalar Node.js
    Write-Host "   Descargando Node.js..." -ForegroundColor Yellow
    $nodeUrl = "https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi"
    $nodeInstaller = "$env:TEMP\node-installer.msi"
    
    try {
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
        Write-Host "   Instalando Node.js..." -ForegroundColor Yellow
        Start-Process msiexec.exe -ArgumentList "/i $nodeInstaller /quiet" -Wait
        Write-Host "   Node.js instalado correctamente" -ForegroundColor Green
    } catch {
        Write-Host "   ERROR: No se pudo instalar Node.js automaticamente" -ForegroundColor Red
        Write-Host "   Instala manualmente desde https://nodejs.org/" -ForegroundColor Red
        exit 1
    }
}

# Verificar si npm esta disponible
Write-Host "2. Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "   npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: npm no encontrado" -ForegroundColor Red
    exit 1
}

# Instalar dependencias globales
Write-Host "3. Instalando dependencias globales..." -ForegroundColor Yellow
try {
    npm install -g typescript
    npm install -g @types/node
    Write-Host "   Dependencias globales instaladas" -ForegroundColor Green
} catch {
    Write-Host "   Advertencia: No se pudieron instalar dependencias globales" -ForegroundColor Yellow
}

# Instalar dependencias del proyecto
Write-Host "4. Instalando dependencias del proyecto..." -ForegroundColor Yellow

# API
Write-Host "   Instalando dependencias de la API..." -ForegroundColor Yellow
Push-Location "apps\api"
npm install
Pop-Location

# Dashboard
Write-Host "   Instalando dependencias del Dashboard..." -ForegroundColor Yellow
Push-Location "apps\dashboard"
npm install
Pop-Location

# Verificar instalacion
Write-Host "5. Verificando instalacion..." -ForegroundColor Yellow

if (Test-Path "apps\api\node_modules") {
    Write-Host "   API: OK" -ForegroundColor Green
} else {
    Write-Host "   API: ERROR" -ForegroundColor Red
}

if (Test-Path "apps\dashboard\node_modules") {
    Write-Host "   Dashboard: OK" -ForegroundColor Green
} else {
    Write-Host "   Dashboard: ERROR" -ForegroundColor Red
}

# Crear archivos de configuracion
Write-Host "6. Creando archivos de configuracion..." -ForegroundColor Yellow

# API .env
$ApiEnvFile = "apps\api\.env"
if (-not (Test-Path $ApiEnvFile)) {
    @"
DB_HOST=localhost
DB_PORT=5432
DB_USER=core
DB_PASS=corepass
DB_NAME=corebank
PORT=8080
NODE_ENV=development
"@ | Out-File -Encoding utf8 $ApiEnvFile
    Write-Host "   API .env creado" -ForegroundColor Green
}

# Dashboard .env.local
$DashEnvFile = "apps\dashboard\.env.local"
if (-not (Test-Path $DashEnvFile)) {
    @"
NEXT_PUBLIC_API_BASE=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_NAME=Core Banking Dashboard
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
"@ | Out-File -Encoding utf8 $DashEnvFile
    Write-Host "   Dashboard .env.local creado" -ForegroundColor Green
}

Write-Host "=== INSTALACION COMPLETADA ===" -ForegroundColor Green
Write-Host "Ahora puedes ejecutar: .\start-simple.ps1" -ForegroundColor Yellow
