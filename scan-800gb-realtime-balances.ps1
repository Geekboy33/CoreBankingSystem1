# Script para escanear 800 GB con actualización de balances en tiempo real
param(
    [string]$LargeFilePath = "E:\final AAAA\dtc1b",
    [int]$BlockSize = 50MB,
    [string]$OutputPath = "E:\final AAAA\corebanking\extracted-data",
    [int]$UpdateInterval = 10  # Actualizar cada N bloques
)

Write-Host "=== ESCANEO 800 GB CON BALANCES EN TIEMPO REAL ===" -ForegroundColor Cyan
Write-Host "Archivo: $LargeFilePath" -ForegroundColor Yellow
Write-Host "Tamano de bloque: $([math]::Round($BlockSize/1MB, 2)) MB" -ForegroundColor Yellow
Write-Host "Directorio de salida: $OutputPath" -ForegroundColor Yellow
Write-Host "Actualización cada: $UpdateInterval bloques" -ForegroundColor Yellow

# Crear directorio de salida
if (-not (Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
    Write-Host "Directorio de salida creado: $OutputPath" -ForegroundColor Green
}

# Variables globales para acumular datos
$globalData = @{
    Balances = @()
    Transactions = @()
    Accounts = @()
    CreditCards = @()
    Users = @()
    DAESData = @()
    TotalEUR = 0
    TotalUSD = 0
    TotalGBP = 0
    ProcessedBlocks = 0
    StartTime = Get-Date
    LastUpdateTime = Get-Date
}

# Funcion para actualizar archivo de balances en tiempo real
function Update-RealtimeBalances {
    param(
        [string]$blockNumber,
        [int]$totalBlocks
    )
    
    $currentTime = Get-Date
    $elapsedTime = $currentTime - $globalData.StartTime
    $percentComplete = [math]::Round(($globalData.ProcessedBlocks / $totalBlocks) * 100, 2)
    
    # Crear datos actualizados
    $realtimeData = @{
        timestamp = $currentTime.ToString("yyyy-MM-dd HH:mm:ss")
        progress = @{
            currentBlock = $globalData.ProcessedBlocks
            totalBlocks = $totalBlocks
            percentage = $percentComplete
            elapsedMinutes = [math]::Round($elapsedTime.TotalMinutes, 2)
        }
        balances = @{
            EUR = $globalData.TotalEUR
            USD = $globalData.TotalUSD
            GBP = $globalData.TotalGBP
            totalEUR = $globalData.TotalEUR
            totalUSD = $globalData.TotalUSD
            totalGBP = $globalData.TotalGBP
        }
        statistics = @{
            balancesFound = $globalData.Balances.Count
            transactionsFound = $globalData.Transactions.Count
            accountsFound = $globalData.Accounts.Count
            creditCardsFound = $globalData.CreditCards.Count
            usersFound = $globalData.Users.Count
            daesDataFound = $globalData.DAESData.Count
        }
        recentBalances = $globalData.Balances | Select-Object -Last 10
        recentTransactions = $globalData.Transactions | Select-Object -Last 10
        recentAccounts = $globalData.Accounts | Select-Object -Last 10
        recentCreditCards = $globalData.CreditCards | Select-Object -Last 10
    }
    
    # Guardar archivo de balances en tiempo real
    $realtimeFile = Join-Path $OutputPath "realtime-balances.json"
    $realtimeData | ConvertTo-Json -Depth 10 | Out-File $realtimeFile -Encoding UTF8
    
    # Guardar archivo de dashboard
    $dashboardFile = Join-Path $OutputPath "dashboard-data.json"
    $dashboardData = @{
        balances = $globalData.Balances | Select-Object -First 100
        transactions = $globalData.Transactions | Select-Object -First 100
        accounts = $globalData.Accounts | Select-Object -First 100
        creditCards = $globalData.CreditCards | Select-Object -First 100
        users = $globalData.Users | Select-Object -First 100
        totals = @{
            EUR = $globalData.TotalEUR
            USD = $globalData.TotalUSD
            GBP = $globalData.TotalGBP
        }
        lastUpdate = $currentTime
        progress = $percentComplete
    }
    $dashboardData | ConvertTo-Json -Depth 10 | Out-File $dashboardFile -Encoding UTF8
    
    Write-Host "`n🔄 BALANCES ACTUALIZADOS - Bloque $blockNumber de $totalBlocks ($percentComplete%)" -ForegroundColor Cyan
    Write-Host "💰 EUR: €$($globalData.TotalEUR.ToString('N2')) | USD: $$($globalData.TotalUSD.ToString('N2')) | GBP: £$($globalData.TotalGBP.ToString('N2'))" -ForegroundColor Green
    Write-Host "📊 Balances: $($globalData.Balances.Count) | Transacciones: $($globalData.Transactions.Count) | Cuentas: $($globalData.Accounts.Count)" -ForegroundColor Yellow
    Write-Host "💳 Tarjetas: $($globalData.CreditCards.Count) | Usuarios: $($globalData.Users.Count) | DAES: $($globalData.DAESData.Count)" -ForegroundColor Yellow
    Write-Host "⏱️ Tiempo transcurrido: $([math]::Round($elapsedTime.TotalMinutes, 2)) minutos" -ForegroundColor White
}

# Funcion para decodificar DAES
function Decode-DAESData {
    param(
        [string]$content,
        [string]$blockNumber
    )
    
    $daesData = @()
    
    # Buscar patrones DAES
    $daesPatterns = @(
        'DAES[:\s]+([A-Za-z0-9+/=]+)',
        'daes[:\s]+([A-Za-z0-9+/=]+)',
        'encrypted[:\s]+([A-Za-z0-9+/=]+)',
        'cipher[:\s]+([A-Za-z0-9+/=]+)',
        'AES[:\s]+([A-Za-z0-9+/=]+)',
        'aes[:\s]+([A-Za-z0-9+/=]+)'
    )
    
    foreach ($pattern in $daesPatterns) {
        $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
            $encryptedData = $match.Groups[1].Value.Trim()
            
            try {
                # Intentar decodificar Base64
                $decodedBytes = [System.Convert]::FromBase64String($encryptedData)
                $decodedString = [System.Text.Encoding]::UTF8.GetString($decodedBytes)
                
                $daesData += @{
                    Type = "DAES"
                    Original = $encryptedData
                    Decoded = $decodedString
                    Block = $blockNumber
                    Position = $match.Index
                }
                
            }
            catch {
                # No es Base64 válido, mantener como texto
                $daesData += @{
                    Type = "DAES_TEXT"
                    Original = $encryptedData
                    Decoded = $encryptedData
                    Block = $blockNumber
                    Position = $match.Index
                }
            }
        }
    }
    
    return $daesData
}

# Funcion para extraer datos financieros
function Extract-FinancialData {
    param(
        [string]$content,
        [string]$blockNumber
    )
    
    $financialData = @{
        Balances = @()
        Transactions = @()
        Accounts = @()
        CreditCards = @()
        Users = @()
    }
    
    # Patrones avanzados para datos financieros
    $patterns = @{
        Balance = @(
            'balance[:\s]+([0-9,]+\.?[0-9]*)',
            'saldo[:\s]+([0-9,]+\.?[0-9]*)',
            'EUR[:\s]+([0-9,]+\.?[0-9]*)',
            'euro[:\s]+([0-9,]+\.?[0-9]*)',
            'amount[:\s]+([0-9,]+\.?[0-9]*)',
            'monto[:\s]+([0-9,]+\.?[0-9]*)',
            'USD[:\s]+([0-9,]+\.?[0-9]*)',
            'dollar[:\s]+([0-9,]+\.?[0-9]*)',
            'GBP[:\s]+([0-9,]+\.?[0-9]*)',
            'pound[:\s]+([0-9,]+\.?[0-9]*)'
        )
        
        Account = @(
            'account[:\s]+([A-Z0-9\-]+)',
            'iban[:\s]+([A-Z0-9]+)',
            'acc[:\s]+([A-Z0-9\-]+)',
            'cuenta[:\s]+([A-Z0-9\-]+)'
        )
        
        CreditCard = @(
            '([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})',
            'card[:\s]+([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})',
            'credit[:\s]+([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})'
        )
        
        CVV = @(
            'cvv[:\s]+([0-9]{3,4})',
            'cvc[:\s]+([0-9]{3,4})',
            'cvv2[:\s]+([0-9]{3,4})'
        )
        
        User = @(
            'user[:\s]+([A-Za-z0-9_\-\.]+)',
            'username[:\s]+([A-Za-z0-9_\-\.]+)',
            'email[:\s]+([A-Za-z0-9_\-\.@]+)',
            'customer[:\s]+([A-Za-z0-9_\-\.]+)'
        )
        
        Transaction = @(
            'transfer[:\s]+([0-9,]+\.?[0-9]*)',
            'payment[:\s]+([0-9,]+\.?[0-9]*)',
            'deposit[:\s]+([0-9,]+\.?[0-9]*)',
            'withdrawal[:\s]+([0-9,]+\.?[0-9]*)'
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
                            
                            $financialData.Balances += @{
                                Block = $blockNumber
                                Balance = $balance
                                Currency = $currency
                                Position = $match.Index
                                RawValue = $value
                                Timestamp = Get-Date
                            }
                            
                            # Actualizar totales globales
                            switch ($currency) {
                                "EUR" { $globalData.TotalEUR += $balance }
                                "USD" { $globalData.TotalUSD += $balance }
                                "GBP" { $globalData.TotalGBP += $balance }
                            }
                        }
                    }
                    
                    "Account" {
                        if ($value -match '^[A-Z0-9\-]+$' -and $value.Length -gt 5) {
                            $financialData.Accounts += @{
                                Block = $blockNumber
                                AccountNumber = $value
                                Position = $match.Index
                                Timestamp = Get-Date
                            }
                        }
                    }
                    
                    "CreditCard" {
                        if ($value -match '^[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}$') {
                            $cardNumber = $value -replace '[\s\-]', ''
                            $cvv = Find-NearbyCVV $content $match.Index
                            
                            $financialData.CreditCards += @{
                                Block = $blockNumber
                                CardNumber = $cardNumber
                                CVV = $cvv
                                Position = $match.Index
                                Timestamp = Get-Date
                            }
                        }
                    }
                    
                    "User" {
                        if ($value.Length -gt 2) {
                            $financialData.Users += @{
                                Block = $blockNumber
                                Username = $value
                                Position = $match.Index
                                Timestamp = Get-Date
                            }
                        }
                    }
                    
                    "Transaction" {
                        if ($value -match '^[0-9,]+\.?[0-9]*$') {
                            $amount = [double]($value -replace ',', '')
                            $currency = Detect-Currency $content $match.Index
                            
                            $financialData.Transactions += @{
                                Block = $blockNumber
                                Amount = $amount
                                Currency = $currency
                                Position = $match.Index
                                Timestamp = Get-Date
                            }
                        }
                    }
                }
            }
        }
    }
    
    return $financialData
}

function Detect-Currency {
    param(
        [string]$content,
        [int]$position
    )
    
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
    
    $cvvPatterns = @(
        'cvv[:\s]+([0-9]{3,4})',
        'cvc[:\s]+([0-9]{3,4})',
        'cvv2[:\s]+([0-9]{3,4})'
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

# Iniciar escaneo completo
try {
    $fileInfo = Get-Item $LargeFilePath
    $fileSize = $fileInfo.Length
    $totalBlocks = [math]::Ceiling($fileSize / $BlockSize)
    
    Write-Host "`n=== INICIANDO ESCANEO CON BALANCES EN TIEMPO REAL ===" -ForegroundColor Cyan
    Write-Host "Tamano del archivo: $([math]::Round($fileSize/1GB, 2)) GB" -ForegroundColor Green
    Write-Host "Total de bloques: $totalBlocks" -ForegroundColor Green
    Write-Host "Tamano por bloque: $([math]::Round($BlockSize/1MB, 2)) MB" -ForegroundColor Green
    Write-Host "Actualización cada: $UpdateInterval bloques" -ForegroundColor Green
    
    $stream = [System.IO.File]::OpenRead($LargeFilePath)
    $reader = New-Object System.IO.StreamReader($stream)
    
    for ($block = 0; $block -lt $totalBlocks; $block++) {
        $buffer = New-Object char[] $BlockSize
        $bytesRead = $reader.Read($buffer, 0, $BlockSize)
        $content = [string]::new($buffer, 0, $bytesRead)
        
        Write-Progress -Activity "Escaneando archivo 800 GB - Balances en Tiempo Real" -Status "Bloque $($block + 1) de $totalBlocks" -PercentComplete (($block + 1) / $totalBlocks * 100)
        
        # Decodificar datos DAES
        $daesData = Decode-DAESData $content $block
        
        # Extraer datos financieros
        $financialData = Extract-FinancialData $content $block
        
        # Acumular datos globales
        $globalData.Balances += $financialData.Balances
        $globalData.Transactions += $financialData.Transactions
        $globalData.Accounts += $financialData.Accounts
        $globalData.CreditCards += $financialData.CreditCards
        $globalData.Users += $financialData.Users
        $globalData.DAESData += $daesData
        $globalData.ProcessedBlocks++
        
        # Actualizar balances en tiempo real cada N bloques
        if (($block + 1) % $UpdateInterval -eq 0) {
            Update-RealtimeBalances ($block + 1) $totalBlocks
        }
        
        # Liberar memoria
        [System.GC]::Collect()
    }
    
    $reader.Close()
    $stream.Close()
    
    Write-Progress -Activity "Escaneando archivo 800 GB - Balances en Tiempo Real" -Completed
    
    # Actualización final
    Update-RealtimeBalances $totalBlocks $totalBlocks
    
    # Mostrar resultados finales
    Write-Host "`n=== ESCANEO COMPLETO FINALIZADO ===" -ForegroundColor Green
    Write-Host "Bloques procesados: $($globalData.ProcessedBlocks)" -ForegroundColor Green
    Write-Host "Tiempo total: $([math]::Round(((Get-Date) - $globalData.StartTime).TotalMinutes, 2)) minutos" -ForegroundColor Green
    
    Write-Host "`n=== RESULTADOS FINALES ===" -ForegroundColor Cyan
    Write-Host "Total EUR: EUR $($globalData.TotalEUR.ToString('N2'))" -ForegroundColor Green
    Write-Host "Total USD: USD $($globalData.TotalUSD.ToString('N2'))" -ForegroundColor Green
    Write-Host "Total GBP: GBP $($globalData.TotalGBP.ToString('N2'))" -ForegroundColor Green
    
    Write-Host "`n=== ESTADISTICAS FINALES ===" -ForegroundColor Yellow
    Write-Host "Balances encontrados: $($globalData.Balances.Count)" -ForegroundColor White
    Write-Host "Transacciones encontradas: $($globalData.Transactions.Count)" -ForegroundColor White
    Write-Host "Cuentas encontradas: $($globalData.Accounts.Count)" -ForegroundColor White
    Write-Host "Tarjetas encontradas: $($globalData.CreditCards.Count)" -ForegroundColor White
    Write-Host "Usuarios encontrados: $($globalData.Users.Count)" -ForegroundColor White
    Write-Host "Datos DAES decodificados: $($globalData.DAESData.Count)" -ForegroundColor White
    
    # Guardar resultados finales
    $finalResults = @{
        ScanInfo = @{
            FilePath = $LargeFilePath
            FileSize = $fileSize
            TotalBlocks = $totalBlocks
            BlockSize = $BlockSize
            ProcessedBlocks = $globalData.ProcessedBlocks
            StartTime = $globalData.StartTime
            EndTime = Get-Date
            TotalTime = ((Get-Date) - $globalData.StartTime).TotalMinutes
        }
        FinancialData = @{
            Balances = $globalData.Balances
            Transactions = $globalData.Transactions
            Accounts = $globalData.Accounts
            CreditCards = $globalData.CreditCards
            Users = $globalData.Users
        }
        DecodedData = @{
            DAESData = $globalData.DAESData
        }
        Totals = @{
            EUR = $globalData.TotalEUR
            USD = $globalData.TotalUSD
            GBP = $globalData.TotalGBP
        }
    }
    
    $finalResults | ConvertTo-Json -Depth 10 | Out-File (Join-Path $OutputPath "final-results.json") -Encoding UTF8
    Write-Host "`nResultados finales guardados en: $OutputPath\final-results.json" -ForegroundColor Cyan
    Write-Host "Balances en tiempo real guardados en: $OutputPath\realtime-balances.json" -ForegroundColor Cyan
    Write-Host "Datos para dashboard guardados en: $OutputPath\dashboard-data.json" -ForegroundColor Cyan
    
    Write-Host "`n=== ESCANEO COMPLETO FINALIZADO ===" -ForegroundColor Green
    
}
catch {
    Write-Host "Error en escaneo completo: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    if ($reader) { $reader.Close() }
    if ($stream) { $stream.Close() }
}
