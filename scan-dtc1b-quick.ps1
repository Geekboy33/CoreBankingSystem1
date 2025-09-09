# Script de Escaneo Rápido DTC1B - Extracción de Balances
param(
    [string]$FilePath = "E:\final AAAA\dtc1b",
    [int]$BlockSizeMB = 50,
    [string]$OutputPath = "E:\final AAAA\corebanking\extracted-data"
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Crear directorio de salida
if (!(Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force
}

Write-Host "=== ESCANEO RÁPIDO DTC1B ===" -ForegroundColor Green
Write-Host "Archivo: $FilePath" -ForegroundColor Yellow
Write-Host "Inicio: $(Get-Date)" -ForegroundColor Yellow

# Verificar archivo
if (!(Test-Path $FilePath)) {
    Write-Error "Archivo no encontrado: $FilePath"
    exit 1
}

$fileInfo = Get-Item $FilePath
$fileSize = $fileInfo.Length
$blockSize = $BlockSizeMB * 1024 * 1024
$totalBlocks = [Math]::Ceiling($fileSize / $blockSize)

Write-Host "Tamaño: $([Math]::Round($fileSize / 1GB, 2)) GB" -ForegroundColor Cyan
Write-Host "Bloques: $totalBlocks" -ForegroundColor Cyan

# Variables de resultados
$allBalances = @()
$startTime = Get-Date
$processedBlocks = 0

# Patrones simples
$patterns = @(
    '\b\d{1,8}\.\d{2}\s*EUR\b',
    '\bEUR\s*\d{1,8}\.\d{2}\b',
    '\b\d{1,8}\.\d{2}\s*USD\b',
    '\bUSD\s*\d{1,8}\.\d{2}\b',
    '\b\d{1,8}\.\d{2}\s*GBP\b',
    '\bGBP\s*\d{1,8}\.\d{2}\b',
    '\b\d{1,8}\.\d{8}\s*BTC\b',
    '\bBTC\s*\d{1,8}\.\d{8}\b',
    '\b\d{1,8}\.\d{8}\s*ETH\b',
    '\bETH\s*\d{1,8}\.\d{8}\b'
)

# Función para extraer números
function Extract-Number($Text) {
    $match = [regex]::Match($Text, '\b\d{1,8}\.\d{1,8}\b')
    if ($match.Success) { return [double]$match.Value }
    $intMatch = [regex]::Match($Text, '\b\d{1,8}\b')
    if ($intMatch.Success) { return [double]$intMatch.Value }
    return 0
}

# Función para detectar moneda
function Detect-Currency($Text) {
    $Text = $Text.ToUpper()
    if ($Text -match 'EUR') { return 'EUR' }
    if ($Text -match 'USD') { return 'USD' }
    if ($Text -match 'GBP') { return 'GBP' }
    if ($Text -match 'BTC') { return 'BTC' }
    if ($Text -match 'ETH') { return 'ETH' }
    return 'UNKNOWN'
}

Write-Host "Iniciando procesamiento rápido..." -ForegroundColor Green

# Procesar archivo
$fileStream = [System.IO.File]::OpenRead($FilePath)

try {
    # Limitar a primeros 200 bloques para prueba
    $maxBlocks = [Math]::Min(200, $totalBlocks)
    
    for ($i = 0; $i -lt $maxBlocks; $i++) {
        $startPosition = $i * $blockSize
        $currentBlockSize = [Math]::Min($blockSize, [long]($fileSize - $startPosition))
        
        $blockData = New-Object byte[] $currentBlockSize
        $fileStream.Seek($startPosition, [System.IO.SeekOrigin]::Begin) | Out-Null
        $bytesRead = $fileStream.Read($blockData, 0, $currentBlockSize)
        
        if ($bytesRead -gt 0) {
            $text = [System.Text.Encoding]::UTF8.GetString($blockData)
            
            # Procesar patrones
            foreach ($pattern in $patterns) {
                $matches = [regex]::Matches($text, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                
                foreach ($match in $matches) {
                    $amount = Extract-Number $match.Value
                    $detectedCurrency = Detect-Currency $match.Value
                    
                    if ($amount -gt 0) {
                        $balance = @{
                            Amount = $amount
                            Currency = $detectedCurrency
                            RawValue = $match.Value
                            Position = $startPosition + $match.Index
                            Block = $i
                            Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
                        }
                        
                        $allBalances += $balance
                    }
                }
            }
            
            $processedBlocks++
            
            # Mostrar progreso cada 25 bloques
            if ($processedBlocks % 25 -eq 0) {
                $progress = ($processedBlocks / $maxBlocks) * 100
                $elapsed = (Get-Date) - $startTime
                
                Write-Host "Progreso: $([Math]::Round($progress, 1))% - Bloques: $processedBlocks/$maxBlocks - Balances: $($allBalances.Count) - Tiempo: $([Math]::Round($elapsed.TotalMinutes, 2)) min" -ForegroundColor Green
            }
        }
    }
} finally {
    $fileStream.Close()
}

$endTime = Get-Date
$totalTime = $endTime - $startTime

Write-Host ""
Write-Host "=== ESCANEO COMPLETADO ===" -ForegroundColor Green
Write-Host "Tiempo: $([Math]::Round($totalTime.TotalMinutes, 2)) minutos" -ForegroundColor Cyan
Write-Host "Bloques procesados: $processedBlocks" -ForegroundColor Cyan
Write-Host "Total Balances: $($allBalances.Count)" -ForegroundColor Cyan

# Calcular balances totales
$totalBalances = @{
    EUR = 0
    USD = 0
    GBP = 0
    BTC = 0
    ETH = 0
}

foreach ($balance in $allBalances) {
    $currency = $balance.Currency
    if ($totalBalances.ContainsKey($currency)) {
        $totalBalances[$currency] += $balance.Amount
    }
}

Write-Host ""
Write-Host "=== BALANCES TOTALES ===" -ForegroundColor Green
Write-Host "EUR Total: $($totalBalances.EUR.ToString('N2'))" -ForegroundColor Yellow
Write-Host "USD Total: $($totalBalances.USD.ToString('N2'))" -ForegroundColor Yellow
Write-Host "GBP Total: $($totalBalances.GBP.ToString('N2'))" -ForegroundColor Yellow
Write-Host "BTC Total: $($totalBalances.BTC.ToString('N8'))" -ForegroundColor Yellow
Write-Host "ETH Total: $($totalBalances.ETH.ToString('N8'))" -ForegroundColor Yellow

# Crear resultados
$completeResults = @{
    scanId = "QUICK_SCAN_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    mode = "QUICK_DTC1B_SCAN"
    progress = @{
        currentBlock = $processedBlocks
        totalBlocks = $totalBlocks
        percentage = ($processedBlocks / $totalBlocks) * 100
        elapsedMinutes = $totalTime.TotalMinutes
        estimatedRemaining = 0
        bytesProcessed = $processedBlocks * $blockSize
        totalBytes = $fileSize
        averageSpeedMBps = [Math]::Round((($processedBlocks * $blockSize) / 1MB) / $totalTime.TotalSeconds, 2)
        memoryUsageMB = [Math]::Round(([System.GC]::GetTotalMemory($false) / 1MB), 2)
    }
    balances = $totalBalances
    statistics = @{
        balancesFound = $allBalances.Count
        transactionsFound = 0
        accountsFound = 0
        creditCardsFound = 0
        usersFound = 0
        daesDataFound = 0
        ethereumWalletsFound = 0
        swiftCodesFound = 0
        ssnsFound = 0
    }
    recentData = @{
        balances = $allBalances | Select-Object -First 100
        transactions = @()
        accounts = @()
        creditCards = @()
        users = @()
        ethereumWallets = @()
    }
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
}

# Guardar resultados
$outputFile = Join-Path $OutputPath "complete-total-balances-scan.json"
$completeResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host ""
Write-Host "Resultados guardados en: $outputFile" -ForegroundColor Green
Write-Host "=== ESCANEO RÁPIDO FINALIZADO ===" -ForegroundColor Green

# Mostrar resumen final
Write-Host ""
Write-Host "=== RESUMEN FINAL ===" -ForegroundColor Magenta
Write-Host "Archivo: $FilePath" -ForegroundColor White
Write-Host "Tamaño: $([Math]::Round($fileSize / 1GB, 2)) GB" -ForegroundColor White
Write-Host "EUR: $($totalBalances.EUR.ToString('N2'))" -ForegroundColor White
Write-Host "USD: $($totalBalances.USD.ToString('N2'))" -ForegroundColor White
Write-Host "GBP: $($totalBalances.GBP.ToString('N2'))" -ForegroundColor White
Write-Host "BTC: $($totalBalances.BTC.ToString('N8'))" -ForegroundColor White
Write-Host "ETH: $($totalBalances.ETH.ToString('N8'))" -ForegroundColor White
Write-Host "Total elementos: $($allBalances.Count)" -ForegroundColor White

Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")





