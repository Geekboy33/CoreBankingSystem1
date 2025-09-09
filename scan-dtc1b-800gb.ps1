# Script avanzado para escanear 800 GB de datos DTC1B
param(
    [string]$DTC1BPath = "E:\dtc1b",
    [int]$BlockSize = 1GB,
    [int]$MaxMemory = 2GB
)

Write-Host "=== ESCANEO AVANZADO DTC1B - 800 GB ===" -ForegroundColor Cyan
Write-Host "Directorio: $DTC1BPath" -ForegroundColor Yellow
Write-Host "Tamaño de bloque: $([math]::Round($BlockSize/1MB, 2)) MB" -ForegroundColor Yellow

# Función para procesar archivos grandes por bloques
function Process-LargeFile {
    param(
        [string]$FilePath,
        [int]$BlockSize = 1MB
    )
    
    try {
        $fileInfo = Get-Item $FilePath
        $fileSize = $fileInfo.Length
        $totalBlocks = [math]::Ceiling($fileSize / $BlockSize)
        
        Write-Host "Procesando: $($fileInfo.Name) ($([math]::Round($fileSize/1MB, 2)) MB)" -ForegroundColor Gray
        
        $balances = @()
        $transactions = @()
        $accounts = @()
        
        $stream = [System.IO.File]::OpenRead($FilePath)
        $reader = New-Object System.IO.StreamReader($stream)
        
        for ($block = 0; $block -lt $totalBlocks; $block++) {
            $buffer = New-Object char[] $BlockSize
            $bytesRead = $reader.Read($buffer, 0, $BlockSize)
            $content = [string]::new($buffer, 0, $bytesRead)
            
            # Procesar contenido del bloque
            $blockResults = Process-Content $content $fileInfo.Name
            $balances += $blockResults.Balances
            $transactions += $blockResults.Transactions
            $accounts += $blockResults.Accounts
            
            Write-Progress -Activity "Procesando $($fileInfo.Name)" -Status "Bloque $($block + 1) de $totalBlocks" -PercentComplete (($block + 1) / $totalBlocks * 100)
            
            # Liberar memoria
            [System.GC]::Collect()
        }
        
        $reader.Close()
        $stream.Close()
        
        return @{
            Balances = $balances
            Transactions = $transactions
            Accounts = $accounts
            FileSize = $fileSize
        }
    }
    catch {
        Write-Host "Error procesando $FilePath : $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Process-Content {
    param(
        [string]$content,
        [string]$fileName
    )
    
    $balances = @()
    $transactions = @()
    $accounts = @()
    
    # Patrones avanzados para detectar datos financieros
    $patterns = @{
        # Balances y montos
        Balance = @(
            'balance[:\s]+([0-9,]+\.?[0-9]*)',
            'saldo[:\s]+([0-9,]+\.?[0-9]*)',
            'amount[:\s]+([0-9,]+\.?[0-9]*)',
            'monto[:\s]+([0-9,]+\.?[0-9]*)',
            'total[:\s]+([0-9,]+\.?[0-9]*)',
            'sum[:\s]+([0-9,]+\.?[0-9]*)'
        )
        
        # Cuentas bancarias
        Account = @(
            'account[:\s]+([A-Z0-9\-]+)',
            'iban[:\s]+([A-Z0-9]+)',
            'acc[:\s]+([A-Z0-9\-]+)',
            'cuenta[:\s]+([A-Z0-9\-]+)',
            'account_number[:\s]+([A-Z0-9\-]+)'
        )
        
        # Monedas
        Currency = @(
            'currency[:\s]+([A-Z]{3})',
            'moneda[:\s]+([A-Z]{3})',
            'curr[:\s]+([A-Z]{3})',
            '([A-Z]{3})[:\s]+[0-9]',
            '€|EUR|USD|\$|GBP|£'
        )
        
        # Transacciones
        Transaction = @(
            'transaction[:\s]+([A-Z0-9\-]+)',
            'txn[:\s]+([A-Z0-9\-]+)',
            'transfer[:\s]+([0-9,]+\.?[0-9]*)',
            'payment[:\s]+([0-9,]+\.?[0-9]*)',
            'deposit[:\s]+([0-9,]+\.?[0-9]*)',
            'withdrawal[:\s]+([0-9,]+\.?[0-9]*)'
        )
        
        # Bancos
        Bank = @(
            'bank[:\s]+([A-Za-z\s]+)',
            'banco[:\s]+([A-Za-z\s]+)',
            'institution[:\s]+([A-Za-z\s]+)',
            'swift[:\s]+([A-Z0-9]+)',
            'bic[:\s]+([A-Z0-9]+)'
        )
    }
    
    # Procesar cada patrón
    foreach ($patternType in $patterns.Keys) {
        foreach ($pattern in $patterns[$patternType]) {
            $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            
            foreach ($match in $matches) {
                $value = $match.Groups[1].Value.Trim()
                
                switch ($patternType) {
                    "Balance" {
                        if ($value -match '^[0-9,]+\.?[0-9]*$') {
                            $balance = [double]($value -replace ',', '')
                            $currency = Detect-Currency $content $match.Index
                            
                            $balances += @{
                                File = $fileName
                                Value = $balance
                                Currency = $currency
                                Type = "Balance"
                                Position = $match.Index
                            }
                        }
                    }
                    
                    "Account" {
                        if ($value -match '^[A-Z0-9\-]+$' -and $value.Length -gt 5) {
                            $accounts += @{
                                File = $fileName
                                AccountNumber = $value
                                Type = "Account"
                                Position = $match.Index
                            }
                        }
                    }
                    
                    "Transaction" {
                        if ($value -match '^[0-9,]+\.?[0-9]*$') {
                            $amount = [double]($value -replace ',', '')
                            $currency = Detect-Currency $content $match.Index
                            
                            $transactions += @{
                                File = $fileName
                                Amount = $amount
                                Currency = $currency
                                Type = "Transaction"
                                Position = $match.Index
                            }
                        }
                    }
                }
            }
        }
    }
    
    return @{
        Balances = $balances
        Transactions = $transactions
        Accounts = $accounts
    }
}

function Detect-Currency {
    param(
        [string]$content,
        [int]$position
    )
    
    # Buscar moneda cercana al balance/transacción
    $currencyPatterns = @(
        'currency[:\s]+([A-Z]{3})',
        'moneda[:\s]+([A-Z]{3})',
        '([A-Z]{3})[:\s]+[0-9]'
    )
    
    foreach ($pattern in $currencyPatterns) {
        $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
            if ([math]::Abs($match.Index - $position) -lt 200) {
                return $match.Groups[1].Value
            }
        }
    }
    
    # Detectar por símbolos cercanos
    $nearbyContent = $content.Substring([math]::Max(0, $position - 100), 200)
    if ($nearbyContent -match '€|EUR') { return "EUR" }
    if ($nearbyContent -match '\$|USD') { return "USD" }
    if ($nearbyContent -match '£|GBP') { return "GBP" }
    
    return "EUR" # Default
}

# Obtener todos los archivos
Write-Host "Escaneando archivos..." -ForegroundColor Green

$allFiles = Get-ChildItem $DTC1BPath -File -Recurse -ErrorAction SilentlyContinue
$totalFiles = $allFiles.Count
$totalSize = ($allFiles | Measure-Object -Property Length -Sum).Sum

Write-Host "Encontrados $totalFiles archivos ($([math]::Round($totalSize/1GB, 2)) GB)" -ForegroundColor Yellow

# Procesar archivos grandes
$allResults = @()
$globalSummary = @{
    TotalFiles = $totalFiles
    TotalSize = $totalSize
    TotalBalances = @{}
    TotalTransactions = @{}
    TotalAccounts = 0
    FileTypes = @{}
    LargestFiles = @()
}

$processedFiles = 0

foreach ($file in $allFiles) {
    $processedFiles++
    Write-Progress -Activity "Procesando archivos DTC1B" -Status "$($file.Name)" -PercentComplete (($processedFiles / $totalFiles) * 100)
    
    if ($file.Length -gt $BlockSize) {
        # Archivo grande - procesar por bloques
        $result = Process-LargeFile $file.FullName $BlockSize
    } else {
        # Archivo pequeño - procesar completo
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            $result = Process-Content $content $file.Name
            $result.FileSize = $file.Length
        }
    }
    
    if ($result) {
        $allResults += $result
        
        # Actualizar resumen global
        foreach ($balance in $result.Balances) {
            $currency = $balance.Currency
            if (-not $globalSummary.TotalBalances.ContainsKey($currency)) {
                $globalSummary.TotalBalances[$currency] = 0
            }
            $globalSummary.TotalBalances[$currency] += $balance.Value
        }
        
        foreach ($transaction in $result.Transactions) {
            $currency = $transaction.Currency
            if (-not $globalSummary.TotalTransactions.ContainsKey($currency)) {
                $globalSummary.TotalTransactions[$currency] = 0
            }
            $globalSummary.TotalTransactions[$currency] += $transaction.Amount
        }
        
        $globalSummary.TotalAccounts += $result.Accounts.Count
        
        # Archivos más grandes
        $globalSummary.LargestFiles += @{
            Name = $file.Name
            Size = $file.Length
            Balances = $result.Balances.Count
            Transactions = $result.Transactions.Count
        }
    }
}

Write-Progress -Activity "Procesando archivos DTC1B" -Completed

# Mostrar resultados
Write-Host "`n=== RESUMEN COMPLETO DTC1B - 800 GB ===" -ForegroundColor Cyan
Write-Host "Archivos procesados: $processedFiles de $totalFiles" -ForegroundColor Green
Write-Host "Tamaño total: $([math]::Round($totalSize/1GB, 2)) GB" -ForegroundColor Green

Write-Host "`n=== BALANCES TOTALES POR MONEDA ===" -ForegroundColor Yellow
foreach ($currency in $globalSummary.TotalBalances.Keys | Sort-Object) {
    $total = $globalSummary.TotalBalances[$currency]
    $symbol = if ($currency -eq "EUR") { "€" } elseif ($currency -eq "USD") { "$" } elseif ($currency -eq "GBP") { "£" } else { $currency }
    Write-Host "$currency: $symbol$($total.ToString('N2'))" -ForegroundColor Green
}

Write-Host "`n=== TRANSACCIONES TOTALES POR MONEDA ===" -ForegroundColor Yellow
foreach ($currency in $globalSummary.TotalTransactions.Keys | Sort-Object) {
    $total = $globalSummary.TotalTransactions[$currency]
    $symbol = if ($currency -eq "EUR") { "€" } elseif ($currency -eq "USD") { "$" } elseif ($currency -eq "GBP") { "£" } else { $currency }
    Write-Host "$currency: $symbol$($total.ToString('N2'))" -ForegroundColor Green
}

Write-Host "`n=== ESTADÍSTICAS ===" -ForegroundColor Yellow
Write-Host "Total cuentas encontradas: $($globalSummary.TotalAccounts)" -ForegroundColor White
Write-Host "Total balances: $(($globalSummary.TotalBalances.Values | Measure-Object -Sum).Sum)" -ForegroundColor White
Write-Host "Total transacciones: $(($globalSummary.TotalTransactions.Values | Measure-Object -Sum).Sum)" -ForegroundColor White

Write-Host "`n=== ARCHIVOS MÁS GRANDES ===" -ForegroundColor Yellow
$largestFiles = $globalSummary.LargestFiles | Sort-Object Size -Descending | Select-Object -First 10
foreach ($file in $largestFiles) {
    Write-Host "$($file.Name): $([math]::Round($file.Size/1MB, 2)) MB - $($file.Balances) balances, $($file.Transactions) transactions" -ForegroundColor Green
}

# Guardar resultados detallados
$detailedResults = @{
    Summary = $globalSummary
    Results = $allResults
    ScanDate = Get-Date
    ScanPath = $DTC1BPath
    BlockSize = $BlockSize
}

$detailedResults | ConvertTo-Json -Depth 10 | Out-File "dtc1b-800gb-scan-results.json" -Encoding UTF8
Write-Host "`nResultados detallados guardados en: dtc1b-800gb-scan-results.json" -ForegroundColor Cyan

# Crear resumen ejecutivo
$executiveSummary = @{
    TotalSizeGB = [math]::Round($totalSize/1GB, 2)
    TotalFiles = $totalFiles
    TotalBalances = $globalSummary.TotalBalances
    TotalTransactions = $globalSummary.TotalTransactions
    TopCurrencies = $globalSummary.TotalBalances.Keys | Sort-Object { $globalSummary.TotalBalances[$_] } -Descending
    LargestFile = ($largestFiles | Select-Object -First 1).Name
}

$executiveSummary | ConvertTo-Json -Depth 5 | Out-File "dtc1b-executive-summary.json" -Encoding UTF8
Write-Host "Resumen ejecutivo guardado en: dtc1b-executive-summary.json" -ForegroundColor Cyan

Write-Host "`n=== ESCANEO 800 GB COMPLETADO ===" -ForegroundColor Green
