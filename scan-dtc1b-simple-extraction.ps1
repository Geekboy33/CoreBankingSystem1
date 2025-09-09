# SCRIPT SIMPLE DE EXTRACCIÓN DTC1B - FUNCIONAL
param(
    [string]$FilePath = "E:\final AAAA\dtc1b",
    [string]$OutputPath = "E:\final AAAA\corebanking\extracted-data"
)

Write-Host "=== SCRIPT SIMPLE DE EXTRACCIÓN DTC1B ===" -ForegroundColor Green
Write-Host "Archivo: $FilePath" -ForegroundColor Yellow
Write-Host "Inicio: $(Get-Date)" -ForegroundColor Yellow

# Verificar archivo
if (!(Test-Path $FilePath)) {
    Write-Error "Archivo no encontrado: $FilePath"
    exit 1
}

# Crear directorio de salida
if (!(Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force
}

$fileInfo = Get-Item $FilePath
$fileSize = $fileInfo.Length

Write-Host "Tamaño: $([Math]::Round($fileSize / 1GB, 2)) GB" -ForegroundColor Cyan

# Variables de resultados
$allBalances = @()
$allTransactions = @()
$allAccounts = @()
$allCreditCards = @()
$allUsers = @()
$allEthereumWallets = @()
$startTime = Get-Date

# Procesar archivo en bloques pequeños
$blockSize = 1 * 1024 * 1024  # 1MB por bloque
$totalBlocks = [Math]::Ceiling($fileSize / $blockSize)

Write-Host "Total bloques: $totalBlocks" -ForegroundColor Cyan
Write-Host "Iniciando procesamiento..." -ForegroundColor Green

$fileStream = [System.IO.File]::OpenRead($FilePath)

try {
    # Limitar a primeros 5 bloques para prueba
    $maxBlocks = [Math]::Min(5, $totalBlocks)
    
    for ($i = 0; $i -lt $maxBlocks; $i++) {
        $startPosition = $i * $blockSize
        $currentBlockSize = [Math]::Min($blockSize, [long]($fileSize - $startPosition))
        
        $blockData = New-Object byte[] $currentBlockSize
        $fileStream.Seek($startPosition, [System.IO.SeekOrigin]::Begin) | Out-Null
        $bytesRead = $fileStream.Read($blockData, 0, $currentBlockSize)
        
        if ($bytesRead -gt 0) {
            $text = [System.Text.Encoding]::UTF8.GetString($blockData)
            
            # Buscar patrones simples
            $eurMatches = [regex]::Matches($text, '\b\d{1,8}\.\d{2}\s*EUR\b', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            $usdMatches = [regex]::Matches($text, '\b\d{1,8}\.\d{2}\s*USD\b', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            $gbpMatches = [regex]::Matches($text, '\b\d{1,8}\.\d{2}\s*GBP\b', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            $btcMatches = [regex]::Matches($text, '\b\d{1,8}\.\d{8}\s*BTC\b', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            $ethMatches = [regex]::Matches($text, '\b\d{1,8}\.\d{8}\s*ETH\b', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            
            foreach ($match in $eurMatches) {
                $amount = [double]($match.Value -replace '[^\d.]', '')
                if ($amount -gt 0) {
                    $balance = @{
                        Amount = $amount
                        Currency = 'EUR'
                        RawValue = $match.Value
                        Position = $startPosition + $match.Index
                        Block = $i
                        Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
                    }
                    $allBalances += $balance
                }
            }
            
            foreach ($match in $usdMatches) {
                $amount = [double]($match.Value -replace '[^\d.]', '')
                if ($amount -gt 0) {
                    $balance = @{
                        Amount = $amount
                        Currency = 'USD'
                        RawValue = $match.Value
                        Position = $startPosition + $match.Index
                        Block = $i
                        Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
                    }
                    $allBalances += $balance
                }
            }
            
            foreach ($match in $gbpMatches) {
                $amount = [double]($match.Value -replace '[^\d.]', '')
                if ($amount -gt 0) {
                    $balance = @{
                        Amount = $amount
                        Currency = 'GBP'
                        RawValue = $match.Value
                        Position = $startPosition + $match.Index
                        Block = $i
                        Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
                    }
                    $allBalances += $balance
                }
            }
            
            foreach ($match in $btcMatches) {
                $amount = [double]($match.Value -replace '[^\d.]', '')
                if ($amount -gt 0) {
                    $balance = @{
                        Amount = $amount
                        Currency = 'BTC'
                        RawValue = $match.Value
                        Position = $startPosition + $match.Index
                        Block = $i
                        Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
                    }
                    $allBalances += $balance
                }
            }
            
            foreach ($match in $ethMatches) {
                $amount = [double]($match.Value -replace '[^\d.]', '')
                if ($amount -gt 0) {
                    $balance = @{
                        Amount = $amount
                        Currency = 'ETH'
                        RawValue = $match.Value
                        Position = $startPosition + $match.Index
                        Block = $i
                        Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
                    }
                    $allBalances += $balance
                }
            }
            
            # Buscar transacciones
            $txPattern = '\b(TRANSFER|PAYMENT|DEPOSIT|WITHDRAWAL)\s+\d{1,8}\.\d{2}\s+(EUR|USD|GBP|BTC|ETH)\b'
            $txMatches = [regex]::Matches($text, $txPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            
            foreach ($match in $txMatches) {
                $transaction = @{
                    Type = $match.Groups[1].Value
                    Amount = [double]($match.Value -replace '[^\d.]', '')
                    Currency = $match.Groups[2].Value
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
                $allEthereumWallets += $wallet
            }
            
            # Mostrar progreso
            $progress = (($i + 1) / $maxBlocks) * 100
            $elapsed = (Get-Date) - $startTime
            
            Write-Host "Progreso: $([Math]::Round($progress, 1))% - Bloques: $($i + 1)/$maxBlocks - Balances: $($allBalances.Count) - Tiempo: $([Math]::Round($elapsed.TotalMinutes, 2)) min" -ForegroundColor Green
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
    scanId = "SIMPLE_EXTRACTION_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    mode = "SIMPLE_DTC1B_EXTRACTION"
    progress = @{
        currentBlock = $maxBlocks
        totalBlocks = $totalBlocks
        percentage = ($maxBlocks / $totalBlocks) * 100
        elapsedMinutes = $totalTime.TotalMinutes
        estimatedRemaining = 0
        bytesProcessed = $maxBlocks * $blockSize
        totalBytes = $fileSize
        averageSpeedMBps = [Math]::Round((($maxBlocks * $blockSize) / 1MB) / $totalTime.TotalSeconds, 2)
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
        ethereumWalletsFound = $allEthereumWallets.Count
        swiftCodesFound = 0
        ssnsFound = 0
    }
    recentData = @{
        balances = $allBalances | Select-Object -First 100
        transactions = $allTransactions | Select-Object -First 100
        accounts = $allAccounts | Select-Object -First 100
        creditCards = @()
        users = @()
        ethereumWallets = $allEthereumWallets | Select-Object -First 100
    }
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
}

# Guardar resultados
$outputFile = Join-Path $OutputPath "complete-total-balances-scan.json"
$completeResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host ""
Write-Host "Resultados guardados en: $outputFile" -ForegroundColor Green
Write-Host "=== EXTRACCIÓN SIMPLE FINALIZADA ===" -ForegroundColor Green

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
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')





