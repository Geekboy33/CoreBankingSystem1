# Health-Check.ps1 - Verificación de Salud del Sistema
param(
    [int]$ApiPort = 8080,
    [int]$DashPort = 3000,
    [int]$DbPort = 5432
)

$ErrorActionPreference = 'Stop'

# Colores para output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Función para verificar puerto
function Test-Port($port, $service) {
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $port)
        $connection.Close()
        Write-ColorOutput Green "✅ $service (puerto $port): CONECTADO"
        return $true
    } catch {
        Write-ColorOutput Red "❌ $service (puerto $port): NO CONECTADO"
        return $false
    }
}

# Función para verificar endpoint HTTP
function Test-Endpoint($url, $service) {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput Green "✅ $service: RESPONDE CORRECTAMENTE"
            return $true
        } else {
            Write-ColorOutput Yellow "⚠️ $service: RESPONDE CON CÓDIGO $($response.StatusCode)"
            return $false
        }
    } catch {
        Write-ColorOutput Red "❌ $service: NO RESPONDE"
        return $false
    }
}

# Función para verificar procesos
function Test-Processes {
    Write-ColorOutput Cyan "🔍 Verificando procesos..."
    
    $nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-ColorOutput Green "✅ Procesos Node.js ejecutándose: $($nodeProcesses.Count)"
        foreach ($proc in $nodeProcesses) {
            Write-ColorOutput Yellow "  - PID: $($proc.Id), Memoria: $([math]::Round($proc.WorkingSet64/1MB, 2)) MB"
        }
    } else {
        Write-ColorOutput Red "❌ No hay procesos Node.js ejecutándose"
    }
    
    $dockerProcesses = Get-Process docker -ErrorAction SilentlyContinue
    if ($dockerProcesses) {
        Write-ColorOutput Green "✅ Docker ejecutándose"
    } else {
        Write-ColorOutput Yellow "⚠️ Docker no está ejecutándose"
    }
}

# Función para verificar archivos de configuración
function Test-ConfigFiles {
    Write-ColorOutput Cyan "📁 Verificando archivos de configuración..."
    
    $apiEnv = "apps/api/.env"
    $dashEnv = "apps/dashboard/.env.local"
    
    if (Test-Path $apiEnv) {
        Write-ColorOutput Green "✅ Archivo de configuración de API encontrado"
    } else {
        Write-ColorOutput Yellow "⚠️ Archivo de configuración de API no encontrado"
    }
    
    if (Test-Path $dashEnv) {
        Write-ColorOutput Green "✅ Archivo de configuración de Dashboard encontrado"
    } else {
        Write-ColorOutput Yellow "⚠️ Archivo de configuración de Dashboard no encontrado"
    }
}

# Función para verificar dependencias
function Test-Dependencies {
    Write-ColorOutput Cyan "📦 Verificando dependencias..."
    
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-ColorOutput Green "✅ Node.js: $nodeVersion"
    } else {
        Write-ColorOutput Red "❌ Node.js no encontrado"
    }
    
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-ColorOutput Green "✅ npm: $npmVersion"
    } else {
        Write-ColorOutput Red "❌ npm no encontrado"
    }
    
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-ColorOutput Green "✅ Docker: $dockerVersion"
    } else {
        Write-ColorOutput Yellow "⚠️ Docker no encontrado"
    }
}

# Función principal
function Start-HealthCheck {
    Write-ColorOutput Cyan "🏥 VERIFICACIÓN DE SALUD DEL SISTEMA CORE BANKING"
    Write-ColorOutput Cyan "================================================"
    
    # Verificar dependencias
    Test-Dependencies
    
    # Verificar procesos
    Test-Processes
    
    # Verificar archivos de configuración
    Test-ConfigFiles
    
    Write-ColorOutput Cyan "🌐 Verificando conectividad de servicios..."
    
    # Verificar puertos
    $apiPortOk = Test-Port $ApiPort "API"
    $dashPortOk = Test-Port $DashPort "Dashboard"
    $dbPortOk = Test-Port $DbPort "Base de Datos"
    
    # Verificar endpoints HTTP
    if ($apiPortOk) {
        Test-Endpoint "http://localhost:$ApiPort/health" "API Health"
        Test-Endpoint "http://localhost:$ApiPort/api/v1/ledger/balances" "API Balances"
    }
    
    if ($dashPortOk) {
        Test-Endpoint "http://localhost:$DashPort" "Dashboard"
    }
    
    # Resumen
    Write-ColorOutput Cyan "📊 RESUMEN DE VERIFICACIÓN"
    Write-ColorOutput Cyan "========================="
    
    if ($apiPortOk -and $dashPortOk) {
        Write-ColorOutput Green "🎉 Sistema funcionando correctamente"
        Write-ColorOutput Cyan "📊 Dashboard: http://localhost:$DashPort"
        Write-ColorOutput Cyan "🔌 API: http://localhost:$ApiPort"
    } else {
        Write-ColorOutput Red "❌ Hay problemas con el sistema"
        if (-not $apiPortOk) {
            Write-ColorOutput Yellow "💡 Sugerencia: Ejecuta el script Start-CoreBanking.ps1"
        }
    }
}

# Ejecutar verificación
Start-HealthCheck
