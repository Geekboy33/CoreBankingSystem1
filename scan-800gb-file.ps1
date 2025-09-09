# Script para escanear archivo de 800 GB
param(
    [string]$LargeFilePath = "E:\final AAAA\dtc1b",
    [int]$BlockSize = 100MB
)

Write-Host "=== ESCANEO ARCHIVO 800 GB ===" -ForegroundColor Cyan
Write-Host "Archivo: $LargeFilePath" -ForegroundColor Yellow
Write-Host "Tamano de bloque: $([math]::Round($BlockSize/1MB, 2)) MB" -ForegroundColor Yellow

try {
    $fileInfo = Get-Item $LargeFilePath
    $fileSize = $fileInfo.Length
    $totalBlocks = [math]::Ceiling($fileSize / $BlockSize)
    
    Write-Host "Tamano del archivo: $([math]::Round($fileSize/1GB, 2)) GB" -ForegroundColor Green
    Write-Host "Total de bloques: $totalBlocks" -ForegroundColor Green
    
    $allBalances = @()
    $allTransactions = @()
    $allAccounts = @()
    $totalEUR = 0
    $totalUSD = 0
    $totalGBP = 0
    
    $stream = [System.IO.File]::OpenRead($LargeFilePath)
    $reader = New-Object System.IO.StreamReader($stream)
    
    for ($block = 0; $block -lt $totalBlocks; $block++) {
        $buffer = New-Object char[] $BlockSize
        $bytesRead = $reader.Read($buffer, 0, $BlockSize)
        $content = [string]::new($buffer, 0, $bytesRead)
        
        Write-Progress -Activity "Escaneando archivo 800 GB" -Status "Bloque $($block + 1) de $totalBlocks" -PercentComplete (($block + 1) / $totalBlocks * 100)
        
        # Buscar balances
        $balanceMatches = [regex]::Matches($content, 'balance[:\s]+([0-9,]+\.?[0-9]*)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        $amountMatches = [regex]::Matches($content, 'amount[:\s]+([0-9,]+\.?[0-9]*)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        $currencyMatches = [regex]::Matches($content, 'currency[:\s]+([A-Z]{3})', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        $accountMatches = [regex]::Matches($content, 'account[:\s]+([A-Z0-9\-]+)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        
        foreach ($match in $balanceMatches) {
            $balance = [double]($match.Groups[1].Value -replace ',', '')
            $currency = "EUR"
            
            # Buscar moneda cercana
            foreach ($currMatch in $currencyMatches) {
                if ([math]::Abs($currMatch.Index - $match.Index) -lt 200) {
                    $currency = $currMatch.Groups[1].Value
                    break
                }
            }
            
            $allBalances += @{
                Block = $block
                Balance = $balance
                Currency = $currency
                Position = $match.Index
            }
            
            switch ($currency) {
                "EUR" { $totalEUR += $balance }
                "USD" { $totalUSD += $balance }
                "GBP" { $totalGBP += $balance }
            }
        }
        
        foreach ($match in $amountMatches) {
            $amount = [double]($match.Groups[1].Value -replace ',', '')
            $currency = "EUR"
            
            foreach ($currMatch in $currencyMatches) {
                if ([math]::Abs($currMatch.Index - $match.Index) -lt 200) {
                    $currency = $currMatch.Groups[1].Value
                    break
                }
            }
            
            $allTransactions += @{
                Block = $block
                Amount = $amount
                Currency = $currency
                Position = $match.Index
            }
        }
        
        foreach ($match in $accountMatches) {
            $accountNumber = $match.Groups[1].Value.Trim()
            if ($accountNumber.Length -gt 5) {
                $allAccounts += @{
                    Block = $block
                    AccountNumber = $accountNumber
                    Position = $match.Index
                }
            }
        }
        
        # Liberar memoria
        [System.GC]::Collect()
        
        # Mostrar progreso cada 10 bloques
        if (($block + 1) % 10 -eq 0) {
            Write-Host "Procesados $($block + 1) bloques - EUR: $($totalEUR.ToString('N2')), USD: $($totalUSD.ToString('N2')), GBP: $($totalGBP.ToString('N2'))" -ForegroundColor Green
        }
    }
    
    $reader.Close()
    $stream.Close()
    
    Write-Progress -Activity "Escaneando archivo 800 GB" -Completed
    
    # Mostrar resultados
    Write-Host "`n=== RESUMEN ESCANEO 800 GB ===" -ForegroundColor Cyan
    Write-Host "Bloques procesados: $totalBlocks" -ForegroundColor Green
    Write-Host "Tamano total: $([math]::Round($fileSize/1GB, 2)) GB" -ForegroundColor Green
    
    Write-Host "`n=== BALANCES TOTALES ENCONTRADOS ===" -ForegroundColor Yellow
    Write-Host "Total EUR: EUR $($totalEUR.ToString('N2'))" -ForegroundColor Green
    Write-Host "Total USD: USD $($totalUSD.ToString('N2'))" -ForegroundColor Green
    Write-Host "Total GBP: GBP $($totalGBP.ToString('N2'))" -ForegroundColor Green
    
    Write-Host "`n=== ESTADISTICAS DETALLADAS ===" -ForegroundColor Yellow
    Write-Host "Total balances encontrados: $($allBalances.Count)" -ForegroundColor White
    Write-Host "Total transacciones encontradas: $($allTransactions.Count)" -ForegroundColor White
    Write-Host "Total cuentas encontradas: $($allAccounts.Count)" -ForegroundColor White
    
    Write-Host "`n=== TOP 10 BALANCES EUR ===" -ForegroundColor Yellow
    $eurBalances = $allBalances | Where-Object { $_.Currency -eq "EUR" } | Sort-Object Balance -Descending
    foreach ($balance in $eurBalances | Select-Object -First 10) {
        Write-Host "Bloque $($balance.Block): EUR $($balance.Balance.ToString('N2'))" -ForegroundColor Green
    }
    
    Write-Host "`n=== TOP 10 TRANSACCIONES ===" -ForegroundColor Yellow
    $topTransactions = $allTransactions | Sort-Object Amount -Descending
    foreach ($transaction in $topTransactions | Select-Object -First 10) {
        Write-Host "Bloque $($transaction.Block): $($transaction.Currency) $($transaction.Amount.ToString('N2'))" -ForegroundColor Green
    }
    
    Write-Host "`n=== CUENTAS UNICAS ENCONTRADAS ===" -ForegroundColor Yellow
    $uniqueAccounts = $allAccounts | Group-Object AccountNumber | Sort-Object Count -Descending
    foreach ($account in $uniqueAccounts | Select-Object -First 10) {
        Write-Host "$($account.Name): $($account.Count) ocurrencias" -ForegroundColor Green
    }
    
    # Guardar resultados
    $results = @{
        FilePath = $LargeFilePath
        FileSize = $fileSize
        TotalBlocks = $totalBlocks
        TotalEUR = $totalEUR
        TotalUSD = $totalUSD
        TotalGBP = $totalGBP
        Balances = $allBalances
        Transactions = $allTransactions
        Accounts = $allAccounts
        ScanDate = Get-Date
    }
    
    $results | ConvertTo-Json -Depth 10 | Out-File "dtc1b-800gb-file-scan-results.json" -Encoding UTF8
    Write-Host "`nResultados guardados en: dtc1b-800gb-file-scan-results.json" -ForegroundColor Cyan
    
    Write-Host "`n=== ESCANEO 800 GB COMPLETADO ===" -ForegroundColor Green
    
}
catch {
    Write-Host "Error escaneando archivo: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    if ($reader) { $reader.Close() }
    if ($stream) { $stream.Close() }
}
