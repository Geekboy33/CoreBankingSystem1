# Script de monitoreo en tiempo real
param(
    [int]$Interval = 5,
    [switch]$Continuous = $false
)

Write-Host "=== MONITOREO EN TIEMPO REAL ===" -ForegroundColor Cyan
Write-Host "Intervalo: $Interval segundos" -ForegroundColor Yellow
Write-Host "Presiona Ctrl+C para salir" -ForegroundColor Yellow

function Get-SystemStatus {
    $status = @{
        Timestamp = Get-Date -Format "HH:mm:ss"
        NodeProcesses = 0
        ApiStatus = "DOWN"
        DashboardStatus = "DOWN"
        MemoryUsage = 0
        CpuUsage = 0
    }
    
    # Contar procesos Node.js
    $nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
    $status.NodeProcesses = $nodeProcesses.Count
    
    # Verificar API
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 2 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $status.ApiStatus = "UP"
        }
    } catch {
        $status.ApiStatus = "DOWN"
    }
    
    # Verificar Dashboard
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $status.DashboardStatus = "UP"
        }
    } catch {
        $status.DashboardStatus = "DOWN"
    }
    
    # Uso de memoria de procesos Node.js
    if ($nodeProcesses) {
        $totalMemory = ($nodeProcesses | Measure-Object WorkingSet64 -Sum).Sum
        $status.MemoryUsage = [math]::Round($totalMemory / 1MB, 2)
    }
    
    return $status
}

function Show-Status {
    param($status)
    
    Clear-Host
    Write-Host "=== MONITOREO CORE BANKING ===" -ForegroundColor Cyan
    Write-Host "Ultima actualizacion: $($status.Timestamp)" -ForegroundColor Gray
    Write-Host ""
    
    # Estado de servicios
    Write-Host "SERVICIOS:" -ForegroundColor Yellow
    $apiColor = if ($status.ApiStatus -eq "UP") { "Green" } else { "Red" }
    $dashColor = if ($status.DashboardStatus -eq "UP") { "Green" } else { "Red" }
    
    Write-Host "  API (8080): $($status.ApiStatus)" -ForegroundColor $apiColor
    Write-Host "  Dashboard (3000): $($status.DashboardStatus)" -ForegroundColor $dashColor
    Write-Host ""
    
    # Procesos
    Write-Host "PROCESOS:" -ForegroundColor Yellow
    Write-Host "  Node.js: $($status.NodeProcesses) procesos" -ForegroundColor Green
    Write-Host "  Memoria: $($status.MemoryUsage) MB" -ForegroundColor Green
    Write-Host ""
    
    # Puertos
    Write-Host "PUERTOS:" -ForegroundColor Yellow
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", 8080)
        $connection.Close()
        Write-Host "  8080: EN USO" -ForegroundColor Green
    } catch {
        Write-Host "  8080: LIBRE" -ForegroundColor Red
    }
    
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", 3000)
        $connection.Close()
        Write-Host "  3000: EN USO" -ForegroundColor Green
    } catch {
        Write-Host "  3000: LIBRE" -ForegroundColor Red
    }
    Write-Host ""
    
    # Acciones rapidas
    Write-Host "ACCIONES RAPIDAS:" -ForegroundColor Yellow
    Write-Host "  Ctrl+C: Salir" -ForegroundColor Gray
    Write-Host "  R: Reiniciar servicios" -ForegroundColor Gray
    Write-Host "  L: Ver logs" -ForegroundColor Gray
}

# Bucle principal
do {
    $status = Get-SystemStatus
    Show-Status $status
    
    if ($Continuous) {
        Start-Sleep -Seconds $Interval
    } else {
        break
    }
} while ($true)

Write-Host "Monitoreo terminado" -ForegroundColor Green
