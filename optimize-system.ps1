# Script de optimización del sistema Core Banking
param(
    [switch]$InstallTools = $false,
    [switch]$OptimizeMemory = $true,
    [switch]$OptimizeNetwork = $true
)

Write-Host "=== OPTIMIZACIÓN DEL SISTEMA CORE BANKING ===" -ForegroundColor Cyan

# Verificar herramientas disponibles
function Test-ToolAvailable {
    param([string]$toolName)
    try {
        & $toolName --version 2>$null | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Instalar herramientas de optimización
if ($InstallTools) {
    Write-Host "`n🔧 INSTALANDO HERRAMIENTAS DE OPTIMIZACIÓN" -ForegroundColor Yellow
    
    # Verificar si Chocolatey está disponible
    if (-not (Test-ToolAvailable "choco")) {
        Write-Host "Instalando Chocolatey..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    }
    
    # Instalar herramientas útiles
    $tools = @(
        "7zip",
        "git",
        "nodejs",
        "python",
        "curl"
    )
    
    foreach ($tool in $tools) {
        if (-not (Test-ToolAvailable $tool)) {
            Write-Host "Instalando $tool..." -ForegroundColor Yellow
            choco install $tool -y
        } else {
            Write-Host "✅ $tool ya está instalado" -ForegroundColor Green
        }
    }
}

# Optimización de memoria
if ($OptimizeMemory) {
    Write-Host "`n💾 OPTIMIZACIÓN DE MEMORIA" -ForegroundColor Yellow
    
    # Configurar variables de entorno para optimización
    $env:NODE_OPTIONS = "--max-old-space-size=8192"
    $env:NODE_ENV = "production"
    
    # Configurar PowerShell para mejor rendimiento
    $env:PSModuleAnalysisCachePath = $null
    
    Write-Host "✅ Variables de entorno optimizadas" -ForegroundColor Green
    Write-Host "✅ Memoria máxima de Node.js: 8GB" -ForegroundColor Green
}

# Optimización de red
if ($OptimizeNetwork) {
    Write-Host "`n🌐 OPTIMIZACIÓN DE RED" -ForegroundColor Yellow
    
    # Configurar TCP para mejor rendimiento
    netsh int tcp set global autotuninglevel=normal
    netsh int tcp set global chimney=enabled
    netsh int tcp set global rss=enabled
    
    Write-Host "✅ Configuración TCP optimizada" -ForegroundColor Green
}

# Crear script de inicio optimizado
$OptimizedStartScript = @"
# Script de inicio optimizado para Core Banking
param(
    [int]$ApiPort = 8080,
    [int]$DashPort = 3000
)

# Configuración optimizada
`$env:NODE_OPTIONS = "--max-old-space-size=8192"
`$env:NODE_ENV = "production"

Write-Host "=== INICIO OPTIMIZADO CORE BANKING ===" -ForegroundColor Cyan

# Verificar dependencias
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js no encontrado" -ForegroundColor Red
    exit 1
}

# Limpiar procesos anteriores
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Iniciar API
Write-Host "🚀 Iniciando API optimizada..." -ForegroundColor Yellow
Start-Process powershell.exe -WorkingDirectory "apps\api" -ArgumentList @(
    "-NoExit",
    "-Command",
    "npm install --production; npm run dev"
) | Out-Null

Start-Sleep -Seconds 3

# Iniciar Dashboard
Write-Host "📊 Iniciando Dashboard optimizado..." -ForegroundColor Yellow
Start-Process powershell.exe -WorkingDirectory "apps\dashboard" -ArgumentList @(
    "-NoExit",
    "-Command",
    "npm install --production; npm run build; npm run start"
) | Out-Null

Start-Sleep -Seconds 5

# Verificar servicios
try {
    Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:`$ApiPort/health" -TimeoutSec 5 | Out-Null
    Write-Host "✅ API OK :`$ApiPort" -ForegroundColor Green
} catch {
    Write-Host "⚠️ API no responde :`$ApiPort" -ForegroundColor Yellow
}

try {
    Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:`$DashPort" -TimeoutSec 5 | Out-Null
    Write-Host "✅ Dashboard OK :`$DashPort" -ForegroundColor Green
    Start-Process "http://localhost:`$DashPort" | Out-Null
} catch {
    Write-Host "⚠️ Dashboard no responde :`$DashPort" -ForegroundColor Yellow
}

Write-Host "`n🎯 Sistema Core Banking iniciado y optimizado" -ForegroundColor Green
"@

$OptimizedStartScript | Out-File "start-optimized.ps1" -Encoding UTF8
Write-Host "✅ Script de inicio optimizado creado: start-optimized.ps1" -ForegroundColor Green

# Crear script de monitoreo optimizado
$OptimizedMonitorScript = @"
# Monitoreo optimizado del sistema
while (`$true) {
    Clear-Host
    Write-Host "=== MONITOREO OPTIMIZADO CORE BANKING ===" -ForegroundColor Cyan
    Write-Host "Fecha: `$(Get-Date)" -ForegroundColor Yellow
    
    # Verificar procesos
    `$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
    Write-Host "`n🔄 Procesos Node.js: `$(`$nodeProcesses.Count)" -ForegroundColor Green
    
    # Verificar memoria
    `$memory = Get-WmiObject -Class Win32_OperatingSystem
    `$freeMemory = [math]::Round(`$memory.FreePhysicalMemory / 1MB, 2)
    `$totalMemory = [math]::Round(`$memory.TotalVisibleMemorySize / 1MB, 2)
    Write-Host "💾 Memoria libre: `$freeMemory MB de `$totalMemory MB" -ForegroundColor Green
    
    # Verificar servicios
    try {
        `$apiStatus = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:8080/health" -TimeoutSec 2
        Write-Host "✅ API: Funcionando" -ForegroundColor Green
    } catch {
        Write-Host "❌ API: No responde" -ForegroundColor Red
    }
    
    try {
        `$dashStatus = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000" -TimeoutSec 2
        Write-Host "✅ Dashboard: Funcionando" -ForegroundColor Green
    } catch {
        Write-Host "❌ Dashboard: No responde" -ForegroundColor Red
    }
    
    # Verificar archivos de datos
    if (Test-Path "extracted-data\dashboard-data.json") {
        `$dataSize = (Get-Item "extracted-data\dashboard-data.json").Length
        Write-Host "📊 Datos extraídos: `$dataSize bytes" -ForegroundColor Green
    }
    
    Start-Sleep -Seconds 10
}
"@

$OptimizedMonitorScript | Out-File "monitor-optimized.ps1" -Encoding UTF8
Write-Host "✅ Script de monitoreo optimizado creado: monitor-optimized.ps1" -ForegroundColor Green

Write-Host "`n=== OPTIMIZACIÓN COMPLETADA ===" -ForegroundColor Green
Write-Host "🎯 Sistema optimizado para máximo rendimiento" -ForegroundColor Yellow
Write-Host "📋 Scripts optimizados creados:" -ForegroundColor Yellow
Write-Host "   - start-optimized.ps1" -ForegroundColor Cyan
Write-Host "   - monitor-optimized.ps1" -ForegroundColor Cyan
Write-Host "   - scan-dtc1b-ultimate.ps1" -ForegroundColor Cyan
