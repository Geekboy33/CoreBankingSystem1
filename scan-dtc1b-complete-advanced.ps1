# Script avanzado para escanear totalidad de datos DTC1B
param(
    [string]$DTC1BPath = "E:\dtc1b",
    [string]$LargeFilePath = "E:\final AAAA\dtc1b",
    [int]$BlockSize = 50MB
)

Write-Host "=== ESCANEO AVANZADO COMPLETO DTC1B ===" -ForegroundColor Cyan
Write-Host "Directorio pequeno: $DTC1BPath" -ForegroundColor Yellow
Write-Host "Archivo grande: $LargeFilePath" -ForegroundColor Yellow
Write-Host "Tamano de bloque: $([math]::Round($BlockSize/1MB, 2)) MB" -ForegroundColor Yellow

# Variables globales
$allBalances = @()
$allTransactions = @()
$allAccounts = @()
$allCreditCards = @()
$allUsers = @()
$totalEUR = 0
$totalUSD = 0
$totalGBP = 0
$fileTypes = @{}

# Funcion para procesar contenido con patrones avanzados
function Process-AdvancedContent {
    param(
        [string]$content,
        [string]$fileName,
        [int]$blockNumber = -1
    )
    
    $results = @{
        Balances = @()
        Transactions = @()
        Accounts = @()
        CreditCards = @()
        Users = @()
    }
    
    # Patrones avanzados para detectar datos financieros
    $patterns = @{
        # Balances y montos
        Balance = @(
            'balance[:\s]+([0-9,]+\.?[0-9]*)',
            'saldo[:\s]+([0-9,]+\.?[0-9]*)',
            'amount[:\s]+([0-9,]+\.?[0-9]*)',
            'monto[:\s]+([0-9,]+\.?[0-9]*)',
            'total[:\s]+([0-9,]+\.?[0-9]*)',
            'sum[:\s]+([0-9,]+\.?[0-9]*)',
            'EUR[:\s]+([0-9,]+\.?[0-9]*)',
            'euro[:\s]+([0-9,]+\.?[0-9]*)'
        )
        
        # Cuentas bancarias
        Account = @(
            'account[:\s]+([A-Z0-9\-]+)',
            'iban[:\s]+([A-Z0-9]+)',
            'acc[:\s]+([A-Z0-9\-]+)',
            'cuenta[:\s]+([A-Z0-9\-]+)',
            'account_number[:\s]+([A-Z0-9\-]+)'
        )
        
        # Tarjetas de credito con CVV
        CreditCard = @(
            'card[:\s]+([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})',
            'credit[:\s]+([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})',
            'visa[:\s]+([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})',
            'mastercard[:\s]+([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})',
            '([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})'
        )
        
        # CVV
        CVV = @(
            'cvv[:\s]+([0-9]{3,4})',
            'cvc[:\s]+([0-9]{3,4})',
            'cvv2[:\s]+([0-9]{3,4})',
            'security[:\s]+([0-9]{3,4})',
            'code[:\s]+([0-9]{3,4})'
        )
        
        # Usuarios
        User = @(
            'user[:\s]+([A-Za-z0-9_\-\.]+)',
            'username[:\s]+([A-Za-z0-9_\-\.]+)',
            'login[:\s]+([A-Za-z0-9_\-\.]+)',
            'email[:\s]+([A-Za-z0-9_\-\.@]+)',
            'customer[:\s]+([A-Za-z0-9_\-\.]+)',
            'client[:\s]+([A-Za-z0-9_\-\.]+)'
        )
        
        # Monedas
        Currency = @(
            'currency[:\s]+([A-Z]{3})',
            'moneda[:\s]+([A-Z]{3})',
            'curr[:\s]+([A-Z]{3})'
        )
        
        # Transacciones
        Transaction = @(
            'transfer[:\s]+([0-9,]+\.?[0-9]*)',
            'payment[:\s]+([0-9,]+\.?[0-9]*)',
            'deposit[:\s]+([0-9,]+\.?[0-9]*)',
            'withdrawal[:\s]+([0-9,]+\.?[0-9]*)',
            'transaction[:\s]+([0-9,]+\.?[0-9]*)'
        )
    }
    
    # Procesar cada tipo de patron
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
                            
                            $results.Balances += @{
                                File = $fileName
                                Block = $blockNumber
                                Balance = $balance
                                Currency = $currency
                                Type = "Balance"
                                Position = $match.Index
                            }
                        }
                    }
                    
                    "Account" {
                        if ($value -match '^[A-Z0-9\-]+$' -and $value.Length -gt 5) {
                            $results.Accounts += @{
                                File = $fileName
                                Block = $blockNumber
                                AccountNumber = $value
                                Type = "Account"
                                Position = $match.Index
                            }
                        }
                    }
                    
                    "CreditCard" {
                        if ($value -match '^[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}$') {
                            $cardNumber = $value -replace '[\s\-]', ''
                            $cvv = Find-NearbyCVV $content $match.Index
                            
                            $results.CreditCards += @{
                                File = $fileName
                                Block = $blockNumber
                                CardNumber = $cardNumber
                                CVV = $cvv
                                Type = "CreditCard"
                                Position = $match.Index
                            }
                        }
                    }
                    
                    "User" {
                        if ($value.Length -gt 2) {
                            $results.Users += @{
                                File = $fileName
                                Block = $blockNumber
                                Username = $value
                                Type = "User"
                                Position = $match.Index
                            }
                        }
                    }
                    
                    "Transaction" {
                        if ($value -match '^[0-9,]+\.?[0-9]*$') {
                            $amount = [double]($value -replace ',', '')
                            $currency = Detect-Currency $content $match.Index
                            
                            $results.Transactions += @{
                                File = $fileName
                                Block = $blockNumber
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
    
    return $results
}

function Detect-Currency {
    param(
        [string]$content,
        [int]$position
    )
    
    # Buscar moneda cercana
    $currencyPatterns = @(
        'currency[:\s]+([A-Z]{3})',
        'moneda[:\s]+([A-Z]{3})',
        'curr[:\s]+([A-Z]{3})'
    )
    
    foreach ($pattern in $currencyPatterns) {
        $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
            if ([math]::Abs($match.Index - $position) -lt 200) {
                return $match.Groups[1].Value
            }
        }
    }
    
    # Detectar por simbolos cercanos
    $nearbyContent = $content.Substring([math]::Max(0, $position - 100), 200)
    if ($nearbyContent -match 'EUR|euro') { return "EUR" }
    elseif ($nearbyContent -match 'USD|dollar') { return "USD" }
    elseif ($nearbyContent -match 'GBP|pound') { return "GBP" }
    
    return "EUR" # Default
}

function Find-NearbyCVV {
    param(
        [string]$content,
        [int]$position
    )
    
    # Buscar CVV cercano a la tarjeta
    $cvvPatterns = @(
        'cvv[:\s]+([0-9]{3,4})',
        'cvc[:\s]+([0-9]{3,4})',
        'cvv2[:\s]+([0-9]{3,4})',
        'security[:\s]+([0-9]{3,4})',
        'code[:\s]+([0-9]{3,4})'
    )
    
    foreach ($pattern in $cvvPatterns) {
        $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
            if ([math]::Abs($match.Index - $position) -lt 300) {
                return $match.Groups[1].Value
            }
        }
    }
    
    return "N/A"
}

# Procesar archivos pequenos
Write-Host "`n=== PROCESANDO ARCHIVOS PEQUENOS ===" -ForegroundColor Green

$smallFiles = Get-ChildItem $DTC1BPath -File -Recurse -ErrorAction SilentlyContinue
$totalSmallFiles = $smallFiles.Count

foreach ($file in $smallFiles) {
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
        
        # Procesar contenido
        $results = Process-AdvancedContent $content $file.Name
        
        # Agregar resultados
        $allBalances += $results.Balances
        $allTransactions += $results.Transactions
        $allAccounts += $results.Accounts
        $allCreditCards += $results.CreditCards
        $allUsers += $results.Users
        
        # Calcular totales
        foreach ($balance in $results.Balances) {
            switch ($balance.Currency) {
                "EUR" { $totalEUR += $balance.Balance }
                "USD" { $totalUSD += $balance.Balance }
                "GBP" { $totalGBP += $balance.Balance }
            }
        }
        
    }
    catch {
        Write-Host "Error analizando $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Procesar archivo grande
Write-Host "`n=== PROCESANDO ARCHIVO GRANDE (800 GB) ===" -ForegroundColor Green

try {
    $fileInfo = Get-Item $LargeFilePath
    $fileSize = $fileInfo.Length
    $totalBlocks = [math]::Ceiling($fileSize / $BlockSize)
    
    Write-Host "Tamano del archivo: $([math]::Round($fileSize/1GB, 2)) GB" -ForegroundColor Green
    Write-Host "Total de bloques: $totalBlocks" -ForegroundColor Green
    
    $stream = [System.IO.File]::OpenRead($LargeFilePath)
    $reader = New-Object System.IO.StreamReader($stream)
    
    for ($block = 0; $block -lt $totalBlocks; $block++) {
        $buffer = New-Object char[] $BlockSize
        $bytesRead = $reader.Read($buffer, 0, $BlockSize)
        $content = [string]::new($buffer, 0, $bytesRead)
        
        Write-Progress -Activity "Escaneando archivo 800 GB" -Status "Bloque $($block + 1) de $totalBlocks" -PercentComplete (($block + 1) / $totalBlocks * 100)
        
        # Procesar contenido del bloque
        $results = Process-AdvancedContent $content "dtc1b-800gb" $block
        
        # Agregar resultados
        $allBalances += $results.Balances
        $allTransactions += $results.Transactions
        $allAccounts += $results.Accounts
        $allCreditCards += $results.CreditCards
        $allUsers += $results.Users
        
        # Calcular totales
        foreach ($balance in $results.Balances) {
            switch ($balance.Currency) {
                "EUR" { $totalEUR += $balance.Balance }
                "USD" { $totalUSD += $balance.Balance }
                "GBP" { $totalGBP += $balance.Balance }
            }
        }
        
        # Liberar memoria
        [System.GC]::Collect()
        
        # Mostrar progreso cada 20 bloques
        if (($block + 1) % 20 -eq 0) {
            Write-Host "Procesados $($block + 1) bloques - EUR: $($totalEUR.ToString('N2')), USD: $($totalUSD.ToString('N2')), GBP: $($totalGBP.ToString('N2'))" -ForegroundColor Green
        }
    }
    
    $reader.Close()
    $stream.Close()
    
    Write-Progress -Activity "Escaneando archivo 800 GB" -Completed
    
}
catch {
    Write-Host "Error procesando archivo grande: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    if ($reader) { $reader.Close() }
    if ($stream) { $stream.Close() }
}

# Mostrar resultados
Write-Host "`n=== RESUMEN COMPLETO DTC1B ===" -ForegroundColor Cyan
Write-Host "Archivos pequenos procesados: $totalSmallFiles" -ForegroundColor Green
Write-Host "Bloques procesados: $totalBlocks" -ForegroundColor Green

Write-Host "`n=== BALANCES TOTALES ENCONTRADOS ===" -ForegroundColor Yellow
Write-Host "Total EUR: EUR $($totalEUR.ToString('N2'))" -ForegroundColor Green
Write-Host "Total USD: USD $($totalUSD.ToString('N2'))" -ForegroundColor Green
Write-Host "Total GBP: GBP $($totalGBP.ToString('N2'))" -ForegroundColor Green

Write-Host "`n=== ESTADISTICAS DETALLADAS ===" -ForegroundColor Yellow
Write-Host "Total balances encontrados: $($allBalances.Count)" -ForegroundColor White
Write-Host "Total transacciones encontradas: $($allTransactions.Count)" -ForegroundColor White
Write-Host "Total cuentas encontradas: $($allAccounts.Count)" -ForegroundColor White
Write-Host "Total tarjetas de credito: $($allCreditCards.Count)" -ForegroundColor White
Write-Host "Total usuarios encontrados: $($allUsers.Count)" -ForegroundColor White

Write-Host "`n=== TIPOS DE ARCHIVO ===" -ForegroundColor Yellow
foreach ($type in $fileTypes.Keys) {
    Write-Host "$type`: $($fileTypes[$type]) archivos" -ForegroundColor White
}

Write-Host "`n=== TOP 20 BALANCES EUR ===" -ForegroundColor Yellow
$eurBalances = $allBalances | Where-Object { $_.Currency -eq "EUR" } | Sort-Object Balance -Descending
foreach ($balance in $eurBalances | Select-Object -First 20) {
    $blockInfo = if ($balance.Block -ge 0) { "Bloque $($balance.Block)" } else { $balance.File }
    Write-Host "$blockInfo`: EUR $($balance.Balance.ToString('N2'))" -ForegroundColor Green
}

Write-Host "`n=== TARJETAS DE CREDITO CON CVV ===" -ForegroundColor Yellow
foreach ($card in $allCreditCards | Select-Object -First 10) {
    $blockInfo = if ($card.Block -ge 0) { "Bloque $($card.Block)" } else { $card.File }
    Write-Host "$blockInfo`: $($card.CardNumber) - CVV: $($card.CVV)" -ForegroundColor Green
}

Write-Host "`n=== USUARIOS ENCONTRADOS ===" -ForegroundColor Yellow
$uniqueUsers = $allUsers | Group-Object Username | Sort-Object Count -Descending
foreach ($user in $uniqueUsers | Select-Object -First 10) {
    Write-Host "$($user.Name): $($user.Count) ocurrencias" -ForegroundColor Green
}

Write-Host "`n=== CUENTAS UNICAS ===" -ForegroundColor Yellow
$uniqueAccounts = $allAccounts | Group-Object AccountNumber | Sort-Object Count -Descending
foreach ($account in $uniqueAccounts | Select-Object -First 10) {
    Write-Host "$($account.Name): $($account.Count) ocurrencias" -ForegroundColor Green
}

# Guardar resultados completos
$completeResults = @{
    TotalSmallFiles = $totalSmallFiles
    TotalBlocks = $totalBlocks
    TotalEUR = $totalEUR
    TotalUSD = $totalUSD
    TotalGBP = $totalGBP
    FileTypes = $fileTypes
    Balances = $allBalances
    Transactions = $allTransactions
    Accounts = $allAccounts
    CreditCards = $allCreditCards
    Users = $allUsers
    ScanDate = Get-Date
}

$completeResults | ConvertTo-Json -Depth 10 | Out-File "dtc1b-complete-advanced-results.json" -Encoding UTF8
Write-Host "`nResultados completos guardados en: dtc1b-complete-advanced-results.json" -ForegroundColor Cyan

Write-Host "`n=== ESCANEO COMPLETO FINALIZADO ===" -ForegroundColor Green
