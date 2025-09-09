# Script de Escaneo Optimizado DTC1B - Extracción Total de Balances
param(
    [string]$FilePath = "E:\final AAAA\dtc1b",
    [int]$BlockSizeMB = 100,
    [string]$OutputPath = "E:\final AAAA\corebanking\extracted-data"
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Crear directorio de salida
if (!(Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force
}

Write-Host "=== ESCANEO OPTIMIZADO DTC1B ===" -ForegroundColor Green
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
$allTransactions = @()
$allAccounts = @()
$allWallets = @()
$startTime = Get-Date
$processedBlocks = 0

# Patrones optimizados
$patterns = @{
    'EUR' = @('\b\d{1,8}\.\d{2}\s*EUR\b', '\bEUR\s*\d{1,8}\.\d{2}\b', '\b\d{1,8}\.\d{2}\s*EURO\b')
    'USD' = @('\b\d{1,8}\.\d{2}\s*USD\b', '\bUSD\s*\d{1,8}\.\d{2}\b', '\b\d{1,8}\.\d{2}\s*DOLLAR\b')
    'GBP' = @('\b\d{1,8}\.\d{2}\s*GBP\b', '\bGBP\s*\d{1,8}\.\d{2}\b', '\b\d{1,8}\.\d{2}\s*POUND\b')
    'BTC' = @('\b\d{1,8}\.\d{8}\s*BTC\b', '\bBTC\s*\d{1,8}\.\d{8}\b')
    'ETH' = @('\b\d{1,8}\.\d{8}\s*ETH\b', '\bETH\s*\d{1,8}\.\d{8}\b')
}

# Funciones optimizadas
function Extract-Number($Text) {
    $match = [regex]::Match($Text, '\b\d{1,8}\.\d{1,8}\b')
    if ($match.Success) { return [double]$match.Value }
    $intMatch = [regex]::Match($Text, '\b\d{1,8}\b')
    if ($intMatch.Success) { return [double]$intMatch.Value }
    return 0
}

function Detect-Currency($Text) {
    $Text = $Text.ToUpper()
    if ($Text -match 'EUR|EURO') { return 'EUR' }
    if ($Text -match 'USD|DOLLAR') { return 'USD' }
    if ($Text -match 'GBP|POUND') { return 'GBP' }
    if ($Text -match 'BTC') { return 'BTC' }
    if ($Text -match 'ETH') { return 'ETH' }
    return 'UNKNOWN'
}

Write-Host "Iniciando procesamiento optimizado..." -ForegroundColor Green

# Procesar archivo
$fileStream = [System.IO.File]::OpenRead($FilePath)

try {
    # Limitar a primeros 500 bloques para prueba inicial
    $maxBlocks = [Math]::Min(500, $totalBlocks)
    
    for ($i = 0; $i -lt $maxBlocks; $i++) {
        $startPosition = $i * $blockSize
        $currentBlockSize = [Math]::Min($blockSize, [long]($fileSize - $startPosition))
        
        $blockData = New-Object byte[] $currentBlockSize
        $fileStream.Seek($startPosition, [System.IO.SeekOrigin]::Begin) | Out-Null
        $bytesRead = $fileStream.Read($blockData, 0, $currentBlockSize)
        
        if ($bytesRead -gt 0) {
            $text = [System.Text.Encoding]::UTF8.GetString($blockData)
            
            # Procesar cada patrón de moneda
            foreach ($currency in $patterns.Keys) {
                foreach ($pattern in $patterns[$currency]) {
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
            }
            
            # Buscar transacciones
            $txPattern = '\b(TRANSFER|PAYMENT|DEPOSIT|WITHDRAWAL)\s+\d{1,8}\.\d{2}\s+(EUR|USD|GBP|BTC|ETH)\b'
            $txMatches = [regex]::Matches($text, $txPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            
            foreach ($match in $txMatches) {
                $transaction = @{
                    Type = $match.Groups[1].Value
                    Amount = Extract-Number $match.Value
                    Currency = Detect-Currency $match.Value
                    RawValue = $match.Value
                    Position = $startPosition + $match.Index
                    Block = $i
                    Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
                }
                
                $allTransactions += $transaction
            }
            
            # Buscar cuentas bancarias
            $accountPattern = '\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b'
            $accountMatches = [regex]::Matches($text, $accountPattern)
            
            foreach ($match in $accountMatches) {
                $account = @{
                    AccountNumber = $match.Value
                    Position = $startPosition + $match.Index
                    Block = $i
                    Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
                }
                
                $allAccounts += $account
            }
            
            # Buscar wallets Ethereum
            $walletPattern = '\b0x[a-fA-F0-9]{40}\b'
            $walletMatches = [regex]::Matches($text, $walletPattern)
            
            foreach ($match in $walletMatches) {
                $wallet = @{
                    Address = $match.Value
                    Position = $startPosition + $match.Index
                    Block = $i
                    Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
                }
                
                $allWallets += $wallet
            }
            
            $processedBlocks++
            
            # Mostrar progreso cada 50 bloques
            if ($processedBlocks % 50 -eq 0) {
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
Write-Host "Bytes procesados: $([Math]::Round(($processedBlocks * $blockSize) / 1GB, 2)) GB" -ForegroundColor Cyan

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
Write-Host "=== BALANCES TOTALES EXTRAÍDOS ===" -ForegroundColor Green
Write-Host "EUR Total: $($totalBalances.EUR.ToString('N2'))" -ForegroundColor Yellow
Write-Host "USD Total: $($totalBalances.USD.ToString('N2'))" -ForegroundColor Yellow
Write-Host "GBP Total: $($totalBalances.GBP.ToString('N2'))" -ForegroundColor Yellow
Write-Host "BTC Total: $($totalBalances.BTC.ToString('N8'))" -ForegroundColor Yellow
Write-Host "ETH Total: $($totalBalances.ETH.ToString('N8'))" -ForegroundColor Yellow

Write-Host ""
Write-Host "=== ESTADÍSTICAS FINALES ===" -ForegroundColor Green
Write-Host "Total Balances: $($allBalances.Count)" -ForegroundColor Cyan
Write-Host "Total Transacciones: $($allTransactions.Count)" -ForegroundColor Cyan
Write-Host "Total Cuentas: $($allAccounts.Count)" -ForegroundColor Cyan
Write-Host "Total Wallets ETH: $($allWallets.Count)" -ForegroundColor Cyan

# Crear resultados completos
$completeResults = @{
    scanId = "OPTIMIZED_SCAN_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    mode = "OPTIMIZED_DTC1B_SCAN"
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
        transactionsFound = $allTransactions.Count
        accountsFound = $allAccounts.Count
        creditCardsFound = 0
        usersFound = 0
        daesDataFound = 0
        ethereumWalletsFound = $allWallets.Count
        swiftCodesFound = 0
        ssnsFound = 0
    }
    recentData = @{
        balances = $allBalances | Select-Object -First 100
        transactions = $allTransactions | Select-Object -First 100
        accounts = $allAccounts | Select-Object -First 100
        creditCards = @()
        users = @()
        ethereumWallets = $allWallets | Select-Object -First 100
    }
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
}

# Guardar resultados
$outputFile = Join-Path $OutputPath "complete-total-balances-scan.json"
$completeResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host ""
Write-Host "Resultados guardados en: $outputFile" -ForegroundColor Green
Write-Host "=== ESCANEO OPTIMIZADO FINALIZADO ===" -ForegroundColor Green

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





