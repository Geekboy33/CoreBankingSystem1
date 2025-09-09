# Script robusto para escanear datos DTC1B
param(
    [string]$DTC1BPath = "E:\dtc1b"
)

Write-Host "=== ESCANEO ROBUSTO DTC1B ===" -ForegroundColor Cyan
Write-Host "Directorio: $DTC1BPath" -ForegroundColor Yellow

# Obtener todos los archivos
$allFiles = Get-ChildItem $DTC1BPath -File -Recurse -ErrorAction SilentlyContinue
$totalFiles = $allFiles.Count
$totalSize = ($allFiles | Measure-Object -Property Length -Sum).Sum

Write-Host "Encontrados $totalFiles archivos ($([math]::Round($totalSize/1GB, 2)) GB)" -ForegroundColor Yellow

$allBalances = @()
$allTransactions = @()
$allAccounts = @()
$totalEUR = 0
$totalUSD = 0
$totalGBP = 0
$fileTypes = @{}

foreach ($file in $allFiles) {
    Write-Host "Analizando: $($file.Name)" -ForegroundColor Gray
    
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $content) { continue }
        
        # Detectar tipo de archivo
        $fileType = "TEXT"
        if ($content.Trim().StartsWith('{')) { $fileType = "JSON" }
        elseif ($content -match 'DTC1B|ACCOUNT:|BALANCE:') { $fileType = "DTC1B" }
        elseif ($content -match ',.*,.*,') { $fileType = "CSV" }
        
        $fileTypes[$fileType]++
        
        # Buscar balances y montos
        $balancePatterns = @(
            'balance[:\s]+([0-9,]+\.?[0-9]*)',
            'saldo[:\s]+([0-9,]+\.?[0-9]*)',
            'amount[:\s]+([0-9,]+\.?[0-9]*)',
            'monto[:\s]+([0-9,]+\.?[0-9]*)',
            'total[:\s]+([0-9,]+\.?[0-9]*)',
            'sum[:\s]+([0-9,]+\.?[0-9]*)'
        )
        
        $currencyPatterns = @(
            'currency[:\s]+([A-Z]{3})',
            'moneda[:\s]+([A-Z]{3})',
            'curr[:\s]+([A-Z]{3})'
        )
        
        $accountPatterns = @(
            'account[:\s]+([A-Z0-9\-]+)',
            'iban[:\s]+([A-Z0-9]+)',
            'acc[:\s]+([A-Z0-9\-]+)',
            'cuenta[:\s]+([A-Z0-9\-]+)'
        )
        
        $transactionPatterns = @(
            'transfer[:\s]+([0-9,]+\.?[0-9]*)',
            'payment[:\s]+([0-9,]+\.?[0-9]*)',
            'deposit[:\s]+([0-9,]+\.?[0-9]*)',
            'withdrawal[:\s]+([0-9,]+\.?[0-9]*)'
        )
        
        # Procesar balances
        foreach ($pattern in $balancePatterns) {
            $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            foreach ($match in $matches) {
                $balance = [double]($match.Groups[1].Value -replace ',', '')
                $currency = "EUR"
                
                # Buscar moneda cercana
                foreach ($currPattern in $currencyPatterns) {
                    $currMatches = [regex]::Matches($content, $currPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                    foreach ($currMatch in $currMatches) {
                        if ([math]::Abs($currMatch.Index - $match.Index) -lt 200) {
                            $currency = $currMatch.Groups[1].Value
                            break
                        }
                    }
                }
                
                # Detectar por simbolos
                $nearbyContent = $content.Substring([math]::Max(0, $match.Index - 100), 200)
                if ($nearbyContent -match 'EUR') { $currency = "EUR" }
                elseif ($nearbyContent -match 'USD') { $currency = "USD" }
                elseif ($nearbyContent -match 'GBP') { $currency = "GBP" }
                
                $allBalances += @{
                    File = $file.Name
                    Balance = $balance
                    Currency = $currency
                    Type = "Balance"
                }
                
                switch ($currency) {
                    "EUR" { $totalEUR += $balance }
                    "USD" { $totalUSD += $balance }
                    "GBP" { $totalGBP += $balance }
                }
            }
        }
        
        # Procesar transacciones
        foreach ($pattern in $transactionPatterns) {
            $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            foreach ($match in $matches) {
                $amount = [double]($match.Groups[1].Value -replace ',', '')
                $currency = "EUR"
                
                # Buscar moneda cercana
                foreach ($currPattern in $currencyPatterns) {
                    $currMatches = [regex]::Matches($content, $currPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                    foreach ($currMatch in $currMatches) {
                        if ([math]::Abs($currMatch.Index - $match.Index) -lt 200) {
                            $currency = $currMatch.Groups[1].Value
                            break
                        }
                    }
                }
                
                $allTransactions += @{
                    File = $file.Name
                    Amount = $amount
                    Currency = $currency
                    Type = "Transaction"
                }
            }
        }
        
        # Procesar cuentas
        foreach ($pattern in $accountPatterns) {
            $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            foreach ($match in $matches) {
                $accountNumber = $match.Groups[1].Value.Trim()
                if ($accountNumber.Length -gt 5) {
                    $allAccounts += @{
                        File = $file.Name
                        AccountNumber = $accountNumber
                        Type = "Account"
                    }
                }
            }
        }
        
    }
    catch {
        Write-Host "Error analizando $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Mostrar resultados
Write-Host "`n=== RESUMEN COMPLETO DTC1B ===" -ForegroundColor Cyan
Write-Host "Archivos procesados: $totalFiles" -ForegroundColor Green
Write-Host "Tamano total: $([math]::Round($totalSize/1GB, 2)) GB" -ForegroundColor Green

Write-Host "`n=== BALANCES TOTALES ENCONTRADOS ===" -ForegroundColor Yellow
Write-Host "Total EUR: EUR $($totalEUR.ToString('N2'))" -ForegroundColor Green
Write-Host "Total USD: USD $($totalUSD.ToString('N2'))" -ForegroundColor Green
Write-Host "Total GBP: GBP $($totalGBP.ToString('N2'))" -ForegroundColor Green

Write-Host "`n=== ESTADISTICAS DETALLADAS ===" -ForegroundColor Yellow
Write-Host "Total balances encontrados: $($allBalances.Count)" -ForegroundColor White
Write-Host "Total transacciones encontradas: $($allTransactions.Count)" -ForegroundColor White
Write-Host "Total cuentas encontradas: $($allAccounts.Count)" -ForegroundColor White

Write-Host "`n=== TIPOS DE ARCHIVO ===" -ForegroundColor Yellow
foreach ($type in $fileTypes.Keys) {
    Write-Host "$type`: $($fileTypes[$type]) archivos" -ForegroundColor White
}

Write-Host "`n=== TOP 10 BALANCES EUR ===" -ForegroundColor Yellow
$eurBalances = $allBalances | Where-Object { $_.Currency -eq "EUR" } | Sort-Object Balance -Descending
foreach ($balance in $eurBalances | Select-Object -First 10) {
    Write-Host "$($balance.File): EUR $($balance.Balance.ToString('N2'))" -ForegroundColor Green
}

Write-Host "`n=== TOP 10 TRANSACCIONES ===" -ForegroundColor Yellow
$topTransactions = $allTransactions | Sort-Object Amount -Descending
foreach ($transaction in $topTransactions | Select-Object -First 10) {
    Write-Host "$($transaction.File): $($transaction.Currency) $($transaction.Amount.ToString('N2'))" -ForegroundColor Green
}

Write-Host "`n=== CUENTAS UNICAS ENCONTRADAS ===" -ForegroundColor Yellow
$uniqueAccounts = $allAccounts | Group-Object AccountNumber | Sort-Object Count -Descending
foreach ($account in $uniqueAccounts | Select-Object -First 10) {
    Write-Host "$($account.Name): $($account.Count) ocurrencias" -ForegroundColor Green
}

# Guardar resultados
$results = @{
    TotalFiles = $totalFiles
    TotalSize = $totalSize
    TotalEUR = $totalEUR
    TotalUSD = $totalUSD
    TotalGBP = $totalGBP
    FileTypes = $fileTypes
    Balances = $allBalances
    Transactions = $allTransactions
    Accounts = $allAccounts
    ScanDate = Get-Date
}

$results | ConvertTo-Json -Depth 10 | Out-File "dtc1b-robust-scan-results.json" -Encoding UTF8
Write-Host "`nResultados guardados en: dtc1b-robust-scan-results.json" -ForegroundColor Cyan

Write-Host "`n=== ESCANEO COMPLETADO ===" -ForegroundColor Green
