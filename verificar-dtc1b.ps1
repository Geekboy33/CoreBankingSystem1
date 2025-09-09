# Script para verificar y probar DTC1B
Write-Host "=== VERIFICACION DTC1B ===" -ForegroundColor Cyan

# Verificar si existe el archivo DTC1B
$dtc1bPath = "E:\dtc1b"
Write-Host "Verificando archivo DTC1B..." -ForegroundColor Yellow

if (Test-Path $dtc1bPath) {
    $fileInfo = Get-Item $dtc1bPath
    Write-Host "Archivo encontrado:" -ForegroundColor Green
    Write-Host "  Nombre: $($fileInfo.Name)" -ForegroundColor White
    Write-Host "  Tamaño: $([math]::Round($fileInfo.Length / 1MB, 2)) MB" -ForegroundColor White
    Write-Host "  Fecha: $($fileInfo.LastWriteTime)" -ForegroundColor White
    
    # Verificar permisos
    try {
        $acl = Get-Acl $dtc1bPath
        Write-Host "  Permisos: OK" -ForegroundColor Green
    } catch {
        Write-Host "  Permisos: ERROR - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Crear archivo de prueba pequeño
    $testPath = "test_dtc1b_sample.bin"
    Write-Host "Creando archivo de prueba..." -ForegroundColor Yellow
    
    # Generar datos de prueba
    $testData = @"
ACC001|EUR|1000.00|2024-01-15|Transferencia inicial
ACC002|USD|1500.00|2024-01-15|Deposito
ACC003|EUR|500.00|2024-01-15|Retiro
ACC004|USD|2000.00|2024-01-15|Pago
"@
    
    $testData | Out-File $testPath -Encoding UTF8
    Write-Host "Archivo de prueba creado: $testPath" -ForegroundColor Green
    
} else {
    Write-Host "ERROR: Archivo DTC1B no encontrado en $dtc1bPath" -ForegroundColor Red
    Write-Host "Creando archivo de prueba..." -ForegroundColor Yellow
    
    # Crear directorio si no existe
    $dir = Split-Path $dtc1bPath -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
    }
    
    # Crear archivo de prueba
    $testData = @"
ACC001|EUR|1000.00|2024-01-15|Transferencia inicial
ACC002|USD|1500.00|2024-01-15|Deposito
ACC003|EUR|500.00|2024-01-15|Retiro
ACC004|USD|2000.00|2024-01-15|Pago
"@
    
    $testData | Out-File $dtc1bPath -Encoding UTF8
    Write-Host "Archivo de prueba creado: $dtc1bPath" -ForegroundColor Green
}

# Verificar servicio de ingesta
Write-Host "Verificando servicio de ingesta..." -ForegroundColor Yellow
$ingestPath = "services\ingest-dtc1b"
if (Test-Path $ingestPath) {
    Write-Host "Servicio de ingesta encontrado" -ForegroundColor Green
    
    # Verificar dependencias
    $packageJsonPath = Join-Path $ingestPath "package.json"
    if (Test-Path $packageJsonPath) {
        Write-Host "package.json encontrado" -ForegroundColor Green
    } else {
        Write-Host "package.json no encontrado" -ForegroundColor Red
    }
    
    # Verificar código fuente
    $srcPath = Join-Path $ingestPath "src"
    if (Test-Path $srcPath) {
        $files = Get-ChildItem $srcPath -Recurse -File
        Write-Host "Archivos de código: $($files.Count)" -ForegroundColor Green
    } else {
        Write-Host "Directorio src no encontrado" -ForegroundColor Red
    }
    
} else {
    Write-Host "ERROR: Servicio de ingesta no encontrado" -ForegroundColor Red
}

# Probar endpoint de análisis
Write-Host "Probando endpoint de análisis..." -ForegroundColor Yellow
try {
    $testFile = "test_dtc1b_sample.bin"
    if (Test-Path $testFile) {
        $response = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/ingest/analyze" -Method POST -Form @{file=Get-Item $testFile}
        Write-Host "Endpoint responde correctamente:" -ForegroundColor Green
        Write-Host "  Archivo: $($response.fileName)" -ForegroundColor White
        Write-Host "  Tamaño: $($response.fileSize) bytes" -ForegroundColor White
        Write-Host "  Líneas: $($response.lines)" -ForegroundColor White
    } else {
        Write-Host "No se puede probar endpoint - archivo de prueba no encontrado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR al probar endpoint: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "=== VERIFICACION COMPLETADA ===" -ForegroundColor Green
