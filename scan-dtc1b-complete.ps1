# Script completo para escanear archivos DTC1B y extraer información financiera
param(
    [string]$DTC1BPath = "E:\dtc1b"
)

Write-Host "=== ESCANEO COMPLETO DTC1B ===" -ForegroundColor Cyan
Write-Host "Analizando directorio: $DTC1BPath" -ForegroundColor Yellow

# Función para analizar archivos DTC1B
function Analyze-DTC1BFile {
    param([string]$FilePath)
    
    try {
        $content = Get-Content $FilePath -Raw -ErrorAction SilentlyContinue
        if (-not $content) { return $null }
        
        $analysis = @{
            FileName = (Split-Path $FilePath -Leaf)
            FilePath = $FilePath
            FileSize = (Get-Item $FilePath).Length
            Accounts = @()
            Transactions = @()
            TotalBalanceEUR = 0
            TotalBalanceUSD = 0
            TotalBalanceGBP = 0
            Currencies = @()
            FileType = "Unknown"
        }
        
        # Detectar tipo de archivo
        if ($content -match 'DTC1B|ACCOUNT:|BALANCE:') {
            $analysis.FileType = "DTC1B"
            $analysis = Parse-DTC1BFormat $content $analysis
        }
        elseif ($content.Trim().StartsWith('{')) {
            $analysis.FileType = "JSON"
            $analysis = Parse-JSONFormat $content $analysis
        }
        elseif ($content -match ',.*,.*,') {
            $analysis.FileType = "CSV"
            $analysis = Parse-CSVFormat $content $analysis
        }
        else {
            $analysis.FileType = "TEXT"
            $analysis = Parse-TextFormat $content $analysis
        }
        
        return $analysis
    }
    catch {
        Write-Host "Error analizando $FilePath : $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Parse-DTC1BFormat {
    param([string]$content, [hashtable]$analysis)
    
    $lines = $content -split "`n" | Where-Object { $_.Trim() }
    $currentAccount = @{}
    $currentTransaction = @{}
    
    foreach ($line in $lines) {
        $line = $line.Trim()
        if (-not $line) { continue }
        
        if ($line -match '^ACCOUNT:\s*(.+)') {
            if ($currentAccount.Count -gt 0) {
                $analysis.Accounts += $currentAccount.Clone()
            }
            $currentAccount = @{
                AccountNumber = $matches[1].Trim()
                Balance = 0
                Currency = "EUR"
                BankName = ""
                AccountType = "Checking"
            }
        }
        elseif ($line -match '^BALANCE:\s*([0-9,]+\.?[0-9]*)') {
            $currentAccount.Balance = [double]($matches[1] -replace ',', '')
        }
        elseif ($line -match '^CURRENCY:\s*([A-Z]{3})') {
            $currentAccount.Currency = $matches[1]
        }
        elseif ($line -match '^BANK:\s*(.+)') {
            $currentAccount.BankName = $matches[1].Trim()
        }
        elseif ($line -match '^TYPE:\s*(.+)') {
            $currentAccount.AccountType = $matches[1].Trim()
        }
        elseif ($line -match '^TRANSACTION:\s*(.+)') {
            if ($currentTransaction.Count -gt 0) {
                $analysis.Transactions += $currentTransaction.Clone()
            }
            $currentTransaction = @{
                TransactionId = $matches[1].Trim()
                Amount = 0
                Currency = "EUR"
                Description = ""
                Date = ""
            }
        }
        elseif ($line -match '^AMOUNT:\s*([0-9,]+\.?[0-9]*)') {
            $currentTransaction.Amount = [double]($matches[1] -replace ',', '')
        }
        elseif ($line -match '^DESCRIPTION:\s*(.+)') {
            $currentTransaction.Description = $matches[1].Trim()
        }
    }
    
    # Agregar último elemento
    if ($currentAccount.Count -gt 0) {
        $analysis.Accounts += $currentAccount.Clone()
    }
    if ($currentTransaction.Count -gt 0) {
        $analysis.Transactions += $currentTransaction.Clone()
    }
    
    # Calcular totales
    foreach ($account in $analysis.Accounts) {
        $analysis.Currencies += $account.Currency
        switch ($account.Currency) {
            "EUR" { $analysis.TotalBalanceEUR += $account.Balance }
            "USD" { $analysis.TotalBalanceUSD += $account.Balance }
            "GBP" { $analysis.TotalBalanceGBP += $account.Balance }
        }
    }
    
    return $analysis
}

function Parse-JSONFormat {
    param([string]$content, [hashtable]$analysis)
    
    try {
        $json = $content | ConvertFrom-Json
        
        if ($json.bankAccounts) {
            foreach ($acc in $json.bankAccounts) {
                $account = @{
                    AccountNumber = if ($acc.accountNumber) { $acc.accountNumber } elseif ($acc.account_id) { $acc.account_id } elseif ($acc.iban) { $acc.iban } else { "UNKNOWN" }
                    Balance = [double](if ($acc.balance) { $acc.balance } else { 0 })
                    Currency = if ($acc.currency) { $acc.currency } else { "EUR" }
                    BankName = if ($acc.bank) { $acc.bank } else { "" }
                    AccountType = if ($acc.type) { $acc.type } else { "Checking" }
                }
                $analysis.Accounts += $account
            }
        }
        
        if ($json.transactions) {
            foreach ($txn in $json.transactions) {
                $transaction = @{
                    TransactionId = if ($txn.id) { $txn.id } elseif ($txn.transactionId) { $txn.transactionId } else { "UNKNOWN" }
                    Amount = [double](if ($txn.amount) { $txn.amount } else { 0 })
                    Currency = if ($txn.currency) { $txn.currency } else { "EUR" }
                    Description = if ($txn.description) { $txn.description } else { "" }
                    Date = if ($txn.date) { $txn.date } else { "" }
                }
                $analysis.Transactions += $transaction
            }
        }
        
        # Calcular totales
        foreach ($account in $analysis.Accounts) {
            $analysis.Currencies += $account.Currency
            switch ($account.Currency) {
                "EUR" { $analysis.TotalBalanceEUR += $account.Balance }
                "USD" { $analysis.TotalBalanceUSD += $account.Balance }
                "GBP" { $analysis.TotalBalanceGBP += $account.Balance }
            }
        }
    }
    catch {
        Write-Host "Error parseando JSON: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    return $analysis
}

function Parse-CSVFormat {
    param([string]$content, [hashtable]$analysis)
    
    $lines = $content -split "`n" | Where-Object { $_.Trim() }
    if ($lines.Count -lt 2) { return $analysis }
    
    $headers = $lines[0] -split ','
    
    for ($i = 1; $i -lt $lines.Count; $i++) {
        $values = $lines[$i] -split ','
        if ($values.Count -lt $headers.Count) { continue }
        
        $row = @{}
        for ($j = 0; $j -lt $headers.Count; $j++) {
            $row[$headers[$j].Trim()] = $values[$j].Trim()
        }
        
        # Detectar si es cuenta o transacción
        if ($row.ContainsKey('balance') -or $row.ContainsKey('accountNumber') -or $row.ContainsKey('iban')) {
            $account = @{
                AccountNumber = if ($row.accountNumber) { $row.accountNumber } elseif ($row.iban) { $row.iban } elseif ($row.account) { $row.account } else { "UNKNOWN" }
                Balance = [double](if ($row.balance) { $row.balance } else { 0 })
                Currency = if ($row.currency) { $row.currency } else { "EUR" }
                BankName = if ($row.bank) { $row.bank } else { "" }
                AccountType = if ($row.type) { $row.type } else { "Checking" }
            }
            $analysis.Accounts += $account
        }
        
        if ($row.ContainsKey('amount') -or $row.ContainsKey('transactionAmount')) {
            $transaction = @{
                TransactionId = if ($row.id) { $row.id } elseif ($row.transactionId) { $row.transactionId } else { "UNKNOWN" }
                Amount = [double](if ($row.amount) { $row.amount } elseif ($row.transactionAmount) { $row.transactionAmount } else { 0 })
                Currency = if ($row.currency) { $row.currency } else { "EUR" }
                Description = if ($row.description) { $row.description } else { "" }
                Date = if ($row.date) { $row.date } else { "" }
            }
            $analysis.Transactions += $transaction
        }
    }
    
    # Calcular totales
    foreach ($account in $analysis.Accounts) {
        $analysis.Currencies += $account.Currency
        switch ($account.Currency) {
            "EUR" { $analysis.TotalBalanceEUR += $account.Balance }
            "USD" { $analysis.TotalBalanceUSD += $account.Balance }
            "GBP" { $analysis.TotalBalanceGBP += $account.Balance }
        }
    }
    
    return $analysis
}

function Parse-TextFormat {
    param([string]$content, [hashtable]$analysis)
    
    # Buscar patrones de cuentas y balances
    $accountPatterns = @(
        'account[:\s]+([A-Z0-9]+)',
        'iban[:\s]+([A-Z0-9]+)',
        'acc[:\s]+([A-Z0-9]+)'
    )
    
    $balancePatterns = @(
        'balance[:\s]+([0-9,]+\.?[0-9]*)',
        'amount[:\s]+([0-9,]+\.?[0-9]*)',
        'saldo[:\s]+([0-9,]+\.?[0-9]*)'
    )
    
    $currencyPatterns = @(
        'currency[:\s]+([A-Z]{3})',
        'moneda[:\s]+([A-Z]{3})',
        '([A-Z]{3})[:\s]+[0-9]'
    )
    
    foreach ($pattern in $accountPatterns) {
        if ($content -match $pattern) {
            $account = @{
                AccountNumber = $matches[1]
                Balance = 0
                Currency = "EUR"
                BankName = ""
                AccountType = "Checking"
            }
            
            # Buscar balance asociado
            foreach ($balancePattern in $balancePatterns) {
                if ($content -match $balancePattern) {
                    $account.Balance = [double]($matches[1] -replace ',', '')
                    break
                }
            }
            
            # Buscar moneda
            foreach ($currencyPattern in $currencyPatterns) {
                if ($content -match $currencyPattern) {
                    $account.Currency = $matches[1]
                    break
                }
            }
            
            if ($account.Balance -gt 0) {
                $analysis.Accounts += $account
            }
        }
    }
    
    # Calcular totales
    foreach ($account in $analysis.Accounts) {
        $analysis.Currencies += $account.Currency
        switch ($account.Currency) {
            "EUR" { $analysis.TotalBalanceEUR += $account.Balance }
            "USD" { $analysis.TotalBalanceUSD += $account.Balance }
            "GBP" { $analysis.TotalBalanceGBP += $account.Balance }
        }
    }
    
    return $analysis
}

# Escanear todos los archivos
Write-Host "Escaneando archivos..." -ForegroundColor Green

$allFiles = Get-ChildItem $DTC1BPath -File -Recurse -ErrorAction SilentlyContinue
$totalFiles = $allFiles.Count
$processedFiles = 0
$totalSize = ($allFiles | Measure-Object -Property Length -Sum).Sum

Write-Host "Encontrados $totalFiles archivos ($([math]::Round($totalSize/1MB, 2)) MB)" -ForegroundColor Yellow

$allAnalysis = @()
$globalSummary = @{
    TotalFiles = $totalFiles
    TotalSize = $totalSize
    TotalAccounts = 0
    TotalTransactions = 0
    TotalBalanceEUR = 0
    TotalBalanceUSD = 0
    TotalBalanceGBP = 0
    Currencies = @()
    FileTypes = @{}
}

foreach ($file in $allFiles) {
    $processedFiles++
    Write-Progress -Activity "Analizando archivos DTC1B" -Status "Procesando $($file.Name)" -PercentComplete (($processedFiles / $totalFiles) * 100)
    
    $analysis = Analyze-DTC1BFile $file.FullName
    if ($analysis) {
        $allAnalysis += $analysis
        
        # Actualizar resumen global
        $globalSummary.TotalAccounts += $analysis.Accounts.Count
        $globalSummary.TotalTransactions += $analysis.Transactions.Count
        $globalSummary.TotalBalanceEUR += $analysis.TotalBalanceEUR
        $globalSummary.TotalBalanceUSD += $analysis.TotalBalanceUSD
        $globalSummary.TotalBalanceGBP += $analysis.TotalBalanceGBP
        $globalSummary.Currencies += $analysis.Currencies
        $globalSummary.FileTypes[$analysis.FileType]++
    }
}

Write-Progress -Activity "Analizando archivos DTC1B" -Completed

# Mostrar resultados
Write-Host "`n=== RESUMEN COMPLETO DTC1B ===" -ForegroundColor Cyan
Write-Host "Archivos procesados: $processedFiles de $totalFiles" -ForegroundColor Green
Write-Host "Tamaño total: $([math]::Round($totalSize/1MB, 2)) MB" -ForegroundColor Green

Write-Host "`n=== BALANCES REALES ===" -ForegroundColor Yellow
Write-Host "Total EUR: €$($globalSummary.TotalBalanceEUR.ToString('N2'))" -ForegroundColor Green
Write-Host "Total USD: $$($globalSummary.TotalBalanceUSD.ToString('N2'))" -ForegroundColor Green
Write-Host "Total GBP: £$($globalSummary.TotalBalanceGBP.ToString('N2'))" -ForegroundColor Green

Write-Host "`n=== ESTADÍSTICAS ===" -ForegroundColor Yellow
Write-Host "Total cuentas: $($globalSummary.TotalAccounts)" -ForegroundColor White
Write-Host "Total transacciones: $($globalSummary.TotalTransactions)" -ForegroundColor White
Write-Host "Monedas encontradas: $($globalSummary.Currencies | Sort-Object | Get-Unique -Count)" -ForegroundColor White

Write-Host "`n=== TIPOS DE ARCHIVO ===" -ForegroundColor Yellow
foreach ($type in $globalSummary.FileTypes.Keys) {
    Write-Host "$type`: $($globalSummary.FileTypes[$type]) archivos" -ForegroundColor White
}

Write-Host "`n=== DETALLE DE CUENTAS EUR ===" -ForegroundColor Yellow
$eurAccounts = $allAnalysis | ForEach-Object { $_.Accounts } | Where-Object { $_.Currency -eq "EUR" } | Sort-Object Balance -Descending
foreach ($account in $eurAccounts | Select-Object -First 10) {
    Write-Host "$($account.AccountNumber): €$($account.Balance.ToString('N2')) - $($account.BankName)" -ForegroundColor Green
}

Write-Host "`n=== ARCHIVOS CON MAYOR BALANCE ===" -ForegroundColor Yellow
$topFiles = $allAnalysis | Sort-Object TotalBalanceEUR -Descending | Select-Object -First 5
foreach ($file in $topFiles) {
    Write-Host "$($file.FileName): €$($file.TotalBalanceEUR.ToString('N2'))" -ForegroundColor Green
}

# Guardar resultados en archivo
$resultsPath = "dtc1b-scan-results.json"
$allAnalysis | ConvertTo-Json -Depth 10 | Out-File $resultsPath -Encoding UTF8
Write-Host "`nResultados guardados en: $resultsPath" -ForegroundColor Cyan

Write-Host "`n=== ESCANEO COMPLETADO ===" -ForegroundColor Green
