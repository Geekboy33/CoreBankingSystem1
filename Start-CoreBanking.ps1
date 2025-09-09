# Start-CoreBanking.ps1 - Script Robusto y Completo
param(
    [int]$ApiPort = 8080,
    [int]$DashPort = 3000,
    [switch]$UseDocker = $false,
    [switch]$SkipChecks = $false
)

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$ApiDir = Join-Path $Root 'apps\api'
$DashDir = Join-Path $Root 'apps\dashboard'

# Colores para output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Funcion para verificar comandos
function Assert-Cmd($cmd) {
    try { 
        & $cmd --version 2>$null | Out-Null
        return $true 
    } catch { 
        return $false 
    }
}

# Funcion para verificar puerto
function Test-Port($port) {
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Funcion para esperar hasta que un servicio este listo
function Wait-ForService($url, $timeout = 30) {
    $startTime = Get-Date
    while ((Get-Date) -lt ($startTime.AddSeconds($timeout))) {
        try {
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                return $true
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    return $false
}

# Funcion para matar procesos de Node.js
function Stop-NodeProcesses {
    try {
        Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-ColorOutput Green "Procesos Node.js anteriores detenidos"
    } catch {
        Write-ColorOutput Yellow "No se encontraron procesos Node.js para detener"
    }
}

# Funcion para verificar dependencias
function Test-Dependencies {
    Write-ColorOutput Cyan "Verificando dependencias..."
    
    if (-not (Assert-Cmd 'node')) { 
        Write-ColorOutput Red "Node.js no encontrado. Instala Node.js desde https://nodejs.org/"
        exit 1 
    }
    
    if (-not (Assert-Cmd 'npm')) { 
        Write-ColorOutput Red "npm no encontrado. Instala npm junto con Node.js"
        exit 1 
    }
    
    if ($UseDocker -and -not (Assert-Cmd 'docker')) {
        Write-ColorOutput Red "Docker no encontrado. Instala Docker Desktop"
        exit 1
    }
    
    Write-ColorOutput Green "Todas las dependencias verificadas"
}

# Funcion para verificar directorios
function Test-Directories {
    Write-ColorOutput Cyan "Verificando estructura del proyecto..."
    
    if (-not (Test-Path $ApiDir)) { 
        Write-ColorOutput Red "No existe $ApiDir"
        exit 1 
    }
    
    if (-not (Test-Path $DashDir)) { 
        Write-ColorOutput Red "No existe $DashDir"
        exit 1 
    }
    
    Write-ColorOutput Green "Estructura del proyecto verificada"
}

# Funcion para crear archivo .env para la API
function Create-ApiEnv {
    $ApiEnvFile = Join-Path $ApiDir ".env"
    if (-not (Test-Path $ApiEnvFile)) {
        @"
# Configuracion de Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=core
DB_PASS=corepass
DB_NAME=corebank

# Configuracion del Servidor
PORT=$ApiPort
NODE_ENV=development

# Configuracion de Cron (opcional)
CRON_PROMOTE=0
PROMOTE_BATCH=1000
CRON_EXPR=*/5 * * * *
"@ | Out-File -Encoding utf8 $ApiEnvFile
        Write-ColorOutput Green "Creado archivo de configuracion de API: $ApiEnvFile"
    }
}

# Funcion para crear archivo .env.local para el Dashboard
function Create-DashboardEnv {
    $DashEnvFile = Join-Path $DashDir ".env.local"
    if (-not (Test-Path $DashEnvFile)) {
        @"
# Configuracion de la API
NEXT_PUBLIC_API_BASE=http://localhost:$ApiPort
NEXT_PUBLIC_WS_URL=ws://localhost:$ApiPort/ws

# Configuracion de la Aplicacion
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_NAME=Core Banking Dashboard

# Configuracion de Next.js
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
"@ | Out-File -Encoding utf8 $DashEnvFile
        Write-ColorOutput Green "Creado archivo de configuracion del Dashboard: $DashEnvFile"
    }
}

# Funcion para instalar dependencias
function Install-Dependencies {
    Write-ColorOutput Cyan "Instalando dependencias..."
    
    # API
    Write-ColorOutput Yellow "Instalando dependencias de la API..."
    Push-Location $ApiDir
    npm install
    Pop-Location
    
    # Dashboard
    Write-ColorOutput Yellow "Instalando dependencias del Dashboard..."
    Push-Location $DashDir
    npm install
    Pop-Location
    
    Write-ColorOutput Green "Dependencias instaladas"
}

# Funcion para iniciar servicios con Docker
function Start-DockerServices {
    Write-ColorOutput Cyan "Iniciando servicios con Docker..."
    
    Push-Location $Root
    docker-compose up -d
    
    # Esperar a que los servicios esten listos
    Write-ColorOutput Yellow "Esperando a que los servicios esten listos..."
    Start-Sleep -Seconds 10
    
    # Verificar servicios
    if (Wait-ForService "http://localhost:$ApiPort/health") {
        Write-ColorOutput Green "API OK :$ApiPort"
    } else {
        Write-ColorOutput Red "API no responde :$ApiPort"
    }
    
    if (Wait-ForService "http://localhost:$DashPort") {
        Write-ColorOutput Green "Dashboard OK :$DashPort"
        Start-Process "http://localhost:$DashPort"
    } else {
        Write-ColorOutput Red "Dashboard no responde :$DashPort"
    }
    
    Pop-Location
}

# Funcion para iniciar servicios manualmente
function Start-ManualServices {
    Write-ColorOutput Cyan "Iniciando servicios manualmente..."
    
    # Detener procesos anteriores
    Stop-NodeProcesses
    
    # Crear archivos de configuracion
    Create-ApiEnv
    Create-DashboardEnv
    
    # Iniciar API
    Write-ColorOutput Yellow "Iniciando API en puerto $ApiPort..."
    $env:PORT = $ApiPort
    Start-Process powershell.exe -WorkingDirectory $ApiDir -ArgumentList @(
        "-NoExit", "-Command", "npm run dev"
    ) -WindowStyle Normal
    
    # Esperar a que la API este lista
    Write-ColorOutput Yellow "Esperando a que la API este lista..."
    Start-Sleep -Seconds 5
    
    if (Wait-ForService "http://localhost:$ApiPort/health") {
        Write-ColorOutput Green "API iniciada correctamente en puerto $ApiPort"
    } else {
        Write-ColorOutput Red "Error al iniciar la API"
        return $false
    }
    
    # Iniciar Dashboard
    Write-ColorOutput Yellow "Iniciando Dashboard en puerto $DashPort..."
    Start-Process powershell.exe -WorkingDirectory $DashDir -ArgumentList @(
        "-NoExit", "-Command", "npm run dev"
    ) -WindowStyle Normal
    
    # Esperar a que el Dashboard este listo
    Write-ColorOutput Yellow "Esperando a que el Dashboard este listo..."
    Start-Sleep -Seconds 5
    
    if (Wait-ForService "http://localhost:$DashPort") {
        Write-ColorOutput Green "Dashboard iniciado correctamente en puerto $DashPort"
        Start-Process "http://localhost:$DashPort"
        return $true
    } else {
        Write-ColorOutput Red "Error al iniciar el Dashboard"
        return $false
    }
}

# Funcion principal
function Start-CoreBanking {
    Write-ColorOutput Cyan "INICIANDO SISTEMA CORE BANKING"
    Write-ColorOutput Cyan "=============================="
    
    # Verificaciones iniciales
    if (-not $SkipChecks) {
        Test-Dependencies
        Test-Directories
        Install-Dependencies
    }
    
    # Verificar puertos
    Write-ColorOutput Cyan "Verificando puertos..."
    if (Test-Port $ApiPort) {
        Write-ColorOutput Yellow "Puerto $ApiPort ya esta en uso"
    }
    if (Test-Port $DashPort) {
        Write-ColorOutput Yellow "Puerto $DashPort ya esta en uso"
    }
    
    # Iniciar servicios
    if ($UseDocker) {
        Start-DockerServices
    } else {
        if (Start-ManualServices) {
            Write-ColorOutput Green "Sistema Core Banking iniciado exitosamente!"
            Write-ColorOutput Cyan "Dashboard: http://localhost:$DashPort"
            Write-ColorOutput Cyan "API: http://localhost:$ApiPort"
        } else {
            Write-ColorOutput Red "Error al iniciar el sistema"
            exit 1
        }
    }
}

# Ejecutar funcion principal
Start-CoreBanking
