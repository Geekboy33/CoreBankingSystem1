# Verificación Completa del Dashboard
$ErrorActionPreference = 'Stop'

Write-Host "=== VERIFICACIÓN COMPLETA DEL DASHBOARD ===" -ForegroundColor Cyan

# Verificar que los servicios estén ejecutándose
Write-Host "`n1. Verificando servicios..." -ForegroundColor Yellow

$dashboardPort = 3000
$apiPort = 8080

# Verificar Dashboard
try {
    $dashboardResponse = Invoke-WebRequest -Uri "http://localhost:$dashboardPort" -TimeoutSec 5 -UseBasicParsing
    if ($dashboardResponse.StatusCode -eq 200) {
        Write-Host "✅ Dashboard funcionando en puerto $dashboardPort" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Dashboard no responde en puerto $dashboardPort" -ForegroundColor Red
}

# Verificar API
try {
    $apiResponse = Invoke-WebRequest -Uri "http://localhost:$apiPort" -TimeoutSec 5 -UseBasicParsing
    if ($apiResponse.StatusCode -eq 200) {
        Write-Host "✅ API funcionando en puerto $apiPort" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ API no responde en puerto $apiPort" -ForegroundColor Red
}

# Verificar endpoints críticos
Write-Host "`n2. Verificando endpoints críticos..." -ForegroundColor Yellow

$endpoints = @(
    @{ Name = "Progreso de Escaneo"; Url = "http://localhost:$dashboardPort/api/v1/data/progress" },
    @{ Name = "Estado Completo"; Url = "http://localhost:$dashboardPort/api/complete-scan/status" },
    @{ Name = "Estado del Sistema"; Url = "http://localhost:$dashboardPort/api/system/status" },
    @{ Name = "Balances del Ledger"; Url = "http://localhost:$dashboardPort/api/v1/ledger/balances" },
    @{ Name = "Datos Financieros"; Url = "http://localhost:$dashboardPort/api/v1/data/financial" }
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint.Url -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($endpoint.Name)" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $($endpoint.Name) - Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $($endpoint.Name) - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Verificar archivos de datos
Write-Host "`n3. Verificando archivos de datos..." -ForegroundColor Yellow

$dataFiles = @(
    "dtc1b-scan-results.json",
    "dtc1b-robust-scan-results.json", 
    "dtc1b-scan-simple-results.json",
    "extracted-data\complete-total-balances-scan.json"
)

foreach ($file in $dataFiles) {
    $filePath = Join-Path $PSScriptRoot $file
    if (Test-Path $filePath) {
        try {
            $content = Get-Content $filePath -Raw | ConvertFrom-Json
            Write-Host "✅ $file - Válido" -ForegroundColor Green
        } catch {
            Write-Host "❌ $file - JSON inválido" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️ $file - No encontrado" -ForegroundColor Yellow
    }
}

# Verificar procesos Node.js
Write-Host "`n4. Verificando procesos..." -ForegroundColor Yellow

$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "✅ Procesos Node.js activos: $($nodeProcesses.Count)" -ForegroundColor Green
    foreach ($process in $nodeProcesses) {
        Write-Host "   PID: $($process.Id) - Memoria: $([math]::Round($process.WorkingSet64/1MB, 2)) MB" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ No se encontraron procesos Node.js" -ForegroundColor Red
}

# Verificar puertos
Write-Host "`n5. Verificando puertos..." -ForegroundColor Yellow

$ports = @(3000, 8080)
foreach ($port in $ports) {
    $connection = $null
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $port)
        $connection.Close()
        Write-Host "✅ Puerto $port - Abierto" -ForegroundColor Green
    } catch {
        Write-Host "❌ Puerto $port - Cerrado" -ForegroundColor Red
    } finally {
        if ($connection) { $connection.Close() }
    }
}

Write-Host "`n=== VERIFICACIÓN COMPLETADA ===" -ForegroundColor Cyan
Write-Host "Dashboard disponible en: http://localhost:$dashboardPort" -ForegroundColor Green
Write-Host "API disponible en: http://localhost:$apiPort" -ForegroundColor Green




