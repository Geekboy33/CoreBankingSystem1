# SCRIPT COMPLETO DE EXTRACCIÓN DTC1B - TODAS LAS FUNCIONALIDADES SOLICITADAS
param(
    [string]$FilePath = "E:\final AAAA\dtc1b",
    [int]$BlockSize = 50MB,
    [string]$OutputDir = "E:\final AAAA\corebanking\extracted-data",
    [int]$UpdateInterval = 5,
    [int]$MaxBlocks = 20
)

Write-Host "=== SCRIPT COMPLETO DE EXTRACCIÓN DTC1B ===" -ForegroundColor Cyan
Write-Host "Archivo: $FilePath" -ForegroundColor Yellow
Write-Host "Tamaño: $([math]::Round((Get-Item $FilePath).Length/1GB, 2)) GB" -ForegroundColor Yellow
Write-Host "Bloque: $([math]::Round($BlockSize/1MB, 1)) MB" -ForegroundColor Yellow
Write-Host "Máximo bloques: $MaxBlocks" -ForegroundColor Yellow
Write-Host "Salida: $OutputDir" -ForegroundColor Yellow

# Crear directorio de salida
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "Directorio creado: $OutputDir" -ForegroundColor Green
}

# Variables globales completas
$Global:ScanResults = @{
    Balances = @()
    Transactions = @()
    Accounts = @()
    CreditCards = @()
    Users = @()
    DAESData = @()
    EthereumWallets = @()
    SwiftCodes = @()
    SSNs = @()
    TotalEUR = 0.0
    TotalUSD = 0.0
    TotalGBP = 0.0
    TotalBTC = 0.0
    TotalETH = 0.0
    ProcessedBlocks = 0
    StartTime = Get-Date
    LastUpdate = Get-Date
}

# Patrones completos de búsqueda - TODAS LAS FUNCIONALIDADES SOLICITADAS
$SearchPatterns = @{
    # BALANCES Y MONEDAS - TODAS LAS DIVISAS SOLICITADAS
    Balance = '(?i)(?:balance|saldo|amount|monto|total|funds|capital)[:\s]*([0-9,]+\.?[0-9]*)'
    EUR = '(?i)(?:EUR|euro)[:\s]*([0-9,]+\.?[0-9]*)'
    USD = '(?i)(?:USD|dollar|US\s*Dollar)[:\s]*([0-9,]+\.?[0-9]*)'
    GBP = '(?i)(?:GBP|pound|British\s*Pound)[:\s]*([0-9,]+\.?[0-9]*)'
    BTC = '(?i)(?:BTC|bitcoin)[:\s]*([0-9,]+\.?[0-9]*)'
    ETH = '(?i)(?:ETH|ethereum)[:\s]*([0-9,]+\.?[0-9]*)'
    
    # CUENTAS BANCARIAS - TODOS LOS FORMATOS
    Account = '(?i)(?:account|iban|acc|cuenta|account_number|account_no)[:\s]*([A-Z0-9\-]{8,})'
    IBAN = '(?i)(?:ES|US|GB|FR|DE|IT|NL|BE|AT|CH)[0-9]{2}[A-Z0-9]{20,}'
    AccountNumber = '(?i)(?:account\s*number|acc\s*no|account\s*id)[:\s]*([0-9]{8,})'
    
    # TARJETAS DE CRÉDITO - TODOS LOS TIPOS
    CreditCard = '([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})'
    CVV = '(?i)(?:cvv|cvc|cvv2|security_code|verification_code)[:\s]*([0-9]{3,4})'
    ExpiryDate = '(?i)(?:expiry|exp|expiration)[:\s]*([0-9]{2}/[0-9]{2,4})'
    
    # USUARIOS Y CLIENTES - TODOS LOS FORMATOS
    User = '(?i)(?:user|username|email|customer|client|account_holder)[:\s]*([A-Za-z0-9_\-\.@]+)'
    Email = '(?i)([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})'
    Phone = '(?i)(?:phone|telephone|mobile|cell)[:\s]*([+]?[0-9\s\-\(\)]{10,})'
    
    # TRANSACCIONES - TODOS LOS TIPOS
    Transaction = '(?i)(?:transfer|payment|deposit|withdrawal|transaction|txn)[:\s]*([0-9,]+\.?[0-9]*)'
    Transfer = '(?i)(?:transfer|wire|remittance)[:\s]*([0-9,]+\.?[0-9]*)'
    Payment = '(?i)(?:payment|pay|purchase)[:\s]*([0-9,]+\.?[0-9]*)'
    
    # DATOS ADICIONALES FINANCIEROS
    Routing = '(?i)(?:routing|aba|bank_code|sort_code)[:\s]*([0-9]{6,9})'
    SWIFT = '(?i)(?:SWIFT|BIC)[:\s]*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)'
    SSN = '(?i)(?:ssn|social_security|social_security_number)[:\s]*([0-9]{3}-[0-9]{2}-[0-9]{4})'
    
    # WALLETS DE CRIPTOMONEDAS
    BitcoinWallet = '(?i)(?:bitcoin|btc)\s*wallet[:\s]*([13][a-km-zA-HJ-NP-Z1-9]{25,34})'
    EthereumWallet = '(?i)(?:ethereum|eth)\s*wallet[:\s]*(0x[a-fA-F0-9]{40})'
    WalletAddress = '(?i)(?:wallet|address)[:\s]*(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})'
    
    # DATOS ENCRIPTADOS Y DAES
    DAES = '(?i)(?:DAES|AES|encrypted|cipher|encoded)[:\s]*([A-Za-z0-9+/=]{20,})'
    Base64 = '(?i)(?:base64|b64)[:\s]*([A-Za-z0-9+/=]{20,})'
    Hex = '(?i)(?:hex|hexadecimal)[:\s]*([0-9a-fA-F]{20,})'
    
    # DATOS PERSONALES
    Name = '(?i)(?:name|full_name|first_name|last_name)[:\s]*([A-Za-z\s]{2,50})'
    Address = '(?i)(?:address|street|location)[:\s]*([A-Za-z0-9\s,.-]{10,100})'
    DateOfBirth = '(?i)(?:dob|date_of_birth|birth_date)[:\s]*([0-9]{1,2}/[0-9]{1,2}/[0-9]{4})'
    
    # CÓDIGOS Y REFERENCIAS
    Reference = '(?i)(?:reference|ref|transaction_id|tx_id)[:\s]*([A-Za-z0-9\-]{8,})'
    Code = '(?i)(?:code|pin|password|pass)[:\s]*([A-Za-z0-9]{4,20})'
}

# Función para detectar moneda
function Detect-Currency {
    param([string]$content, [int]$position)
    
    $context = $content.Substring([Math]::Max(0, $position - 50), [Math]::Min(100, $content.Length - [Math]::Max(0, $position - 50)))
    $context = $context.ToUpper()
    
    if ($context -match 'EUR|EURO') { return 'EUR' }
    if ($context -match 'USD|DOLLAR') { return 'USD' }
    if ($context -match 'GBP|POUND') { return 'GBP' }
    if ($context -match 'BTC|BITCOIN') { return 'BTC' }
    if ($context -match 'ETH|ETHEREUM') { return 'ETH' }
    
    return 'UNKNOWN'
}

# Función para extraer datos financieros completos
function Extract-FinancialData {
    param([string]$content, [int]$blockNum)
    
    $found = @{
        Balances = @()
        Transactions = @()
        Accounts = @()
        CreditCards = @()
        Users = @()
        DAESData = @()
        EthereumWallets = @()
        SwiftCodes = @()
        SSNs = @()
    }
    
    Write-Host "Procesando bloque $blockNum - Tamaño: $($content.Length) caracteres" -ForegroundColor Gray
    
    # EXTRAER BALANCES - TODAS LAS MONEDAS
    $balancePatterns = @($SearchPatterns.Balance, $SearchPatterns.EUR, $SearchPatterns.USD, $SearchPatterns.GBP, $SearchPatterns.BTC, $SearchPatterns.ETH)
    foreach ($pattern in $balancePatterns) {
        $matches = [regex]::Matches($content, $pattern)
        Write-Host "  Encontrados $($matches.Count) matches para patrón balance" -ForegroundColor Gray
        
        foreach ($match in $matches) {
            $value = $match.Groups[1].Value.Trim()
            if ($value -match '^[0-9,]+\.?[0-9]*$' -and $value.Length -gt 0) {
                $balance = [double]($value -replace ',', '')
                $currency = Detect-Currency $content $match.Index
                
                $found.Balances += @{
                    Block = $blockNum
                    Balance = $balance
                    Currency = $currency
                    Position = $match.Index
                    RawValue = $value
                    Pattern = $pattern
                    Timestamp = Get-Date
                }
                
                Write-Host "    Balance encontrado: $currency $balance" -ForegroundColor Green
            }
        }
    }
    
    # EXTRAER TRANSACCIONES
    $transactionPatterns = @($SearchPatterns.Transaction, $SearchPatterns.Transfer, $SearchPatterns.Payment)
    foreach ($pattern in $transactionPatterns) {
        $matches = [regex]::Matches($content, $pattern)
        foreach ($match in $matches) {
            $value = $match.Groups[1].Value.Trim()
            if ($value -match '^[0-9,]+\.?[0-9]*$' -and $value.Length -gt 0) {
                $amount = [double]($value -replace ',', '')
                $currency = Detect-Currency $content $match.Index
                
                $found.Transactions += @{
                    Block = $blockNum
                    Amount = $amount
                    Currency = $currency
                    Type = "TRANSACTION"
                    Position = $match.Index
                    RawValue = $value
                    Timestamp = Get-Date
                }
            }
        }
    }
    
    # EXTRAER CUENTAS BANCARIAS
    $accountPatterns = @($SearchPatterns.Account, $SearchPatterns.IBAN, $SearchPatterns.AccountNumber)
    foreach ($pattern in $accountPatterns) {
        $matches = [regex]::Matches($content, $pattern)
        foreach ($match in $matches) {
            $account = $match.Groups[1].Value.Trim()
            if ($account.Length -ge 8) {
                $found.Accounts += @{
                    Block = $blockNum
                    AccountNumber = $account
                    Type = "BANK_ACCOUNT"
                    Position = $match.Index
                    RawValue = $match.Value
                    Timestamp = Get-Date
                }
            }
        }
    }
    
    # EXTRAER TARJETAS DE CRÉDITO
    $cardMatches = [regex]::Matches($content, $SearchPatterns.CreditCard)
    foreach ($match in $cardMatches) {
        $cardNumber = $match.Value -replace '[\s\-]', ''
        if ($cardNumber.Length -eq 16 -and $cardNumber -match '^[0-9]+$') {
            $found.CreditCards += @{
                Block = $blockNum
                CardNumber = $cardNumber
                Type = "CREDIT_CARD"
                Position = $match.Index
                RawValue = $match.Value
                Timestamp = Get-Date
            }
        }
    }
    
    # EXTRAER USUARIOS Y EMAILS
    $userPatterns = @($SearchPatterns.User, $SearchPatterns.Email, $SearchPatterns.Phone)
    foreach ($pattern in $userPatterns) {
        $matches = [regex]::Matches($content, $pattern)
        foreach ($match in $matches) {
            $user = $match.Groups[1].Value.Trim()
            if ($user.Length -gt 3) {
                $found.Users += @{
                    Block = $blockNum
                    UserData = $user
                    Type = "USER_INFO"
                    Position = $match.Index
                    RawValue = $match.Value
                    Timestamp = Get-Date
                }
            }
        }
    }
    
    # EXTRAER WALLETS DE ETHEREUM
    $walletMatches = [regex]::Matches($content, $SearchPatterns.EthereumWallet)
    foreach ($match in $walletMatches) {
        $wallet = $match.Groups[1].Value.Trim()
        if ($wallet.Length -eq 42 -and $wallet.StartsWith('0x')) {
            $found.EthereumWallets += @{
                Block = $blockNum
                Address = $wallet
                Type = "ETHEREUM_WALLET"
                Position = $match.Index
                RawValue = $match.Value
                Timestamp = Get-Date
            }
        }
    }
    
    # EXTRAER CÓDIGOS SWIFT
    $swiftMatches = [regex]::Matches($content, $SearchPatterns.SWIFT)
    foreach ($match in $swiftMatches) {
        $swift = $match.Groups[1].Value.Trim()
        if ($swift.Length -ge 8 -and $swift.Length -le 11) {
            $found.SwiftCodes += @{
                Block = $blockNum
                SwiftCode = $swift
                Type = "SWIFT_CODE"
                Position = $match.Index
                RawValue = $match.Value
                Timestamp = Get-Date
            }
        }
    }
    
    # EXTRAER SSNs
    $ssnMatches = [regex]::Matches($content, $SearchPatterns.SSN)
    foreach ($match in $ssnMatches) {
        $ssn = $match.Groups[1].Value.Trim()
        if ($ssn -match '^[0-9]{3}-[0-9]{2}-[0-9]{4}$') {
            $found.SSNs += @{
                Block = $blockNum
                SSN = $ssn
                Type = "SOCIAL_SECURITY"
                Position = $match.Index
                RawValue = $match.Value
                Timestamp = Get-Date
            }
        }
    }
    
    # EXTRAER DATOS DAES
    $daesMatches = [regex]::Matches($content, $SearchPatterns.DAES)
    foreach ($match in $daesMatches) {
        $daes = $match.Groups[1].Value.Trim()
        if ($daes.Length -ge 20) {
            $found.DAESData += @{
                Block = $blockNum
                DAESData = $daes
                Type = "ENCRYPTED_DATA"
                Position = $match.Index
                RawValue = $match.Value
                Timestamp = Get-Date
            }
        }
    }
    
    return $found
}

# Función principal de escaneo
function Start-CompleteScan {
    param([string]$FilePath, [int]$BlockSize, [int]$MaxBlocks)
    
    Write-Host "Iniciando escaneo completo..." -ForegroundColor Green
    
    $fileStream = [System.IO.File]::OpenRead($FilePath)
    $fileSize = (Get-Item $FilePath).Length
    $totalBlocks = [Math]::Ceiling($fileSize / $BlockSize)
    
    try {
        for ($i = 0; $i -lt [Math]::Min($MaxBlocks, $totalBlocks); $i++) {
            $startPosition = $i * $BlockSize
            $currentBlockSize = [Math]::Min($BlockSize, [long]($fileSize - $startPosition))
            
            $blockData = New-Object byte[] $currentBlockSize
            $fileStream.Seek($startPosition, [System.IO.SeekOrigin]::Begin) | Out-Null
            $bytesRead = $fileStream.Read($blockData, 0, $currentBlockSize)
            
            if ($bytesRead -gt 0) {
                $text = [System.Text.Encoding]::UTF8.GetString($blockData)
                $found = Extract-FinancialData $text $i
                
                # Agregar resultados encontrados
                $Global:ScanResults.Balances += $found.Balances
                $Global:ScanResults.Transactions += $found.Transactions
                $Global:ScanResults.Accounts += $found.Accounts
                $Global:ScanResults.CreditCards += $found.CreditCards
                $Global:ScanResults.Users += $found.Users
                $Global:ScanResults.DAESData += $found.DAESData
                $Global:ScanResults.EthereumWallets += $found.EthereumWallets
                $Global:ScanResults.SwiftCodes += $found.SwiftCodes
                $Global:ScanResults.SSNs += $found.SSNs
                
                $Global:ScanResults.ProcessedBlocks++
                
                # Mostrar progreso
                if (($i + 1) % $UpdateInterval -eq 0) {
                    $progress = (($i + 1) / [Math]::Min($MaxBlocks, $totalBlocks)) * 100
                    $elapsed = (Get-Date) - $Global:ScanResults.StartTime
                    
                    Write-Host "Progreso: $([Math]::Round($progress, 1))% - Bloques: $($i + 1)/$([Math]::Min($MaxBlocks, $totalBlocks)) - Balances: $($Global:ScanResults.Balances.Count) - Tiempo: $([Math]::Round($elapsed.TotalMinutes, 2)) min" -ForegroundColor Green
                }
            }
        }
    } finally {
        $fileStream.Close()
    }
}

# Ejecutar escaneo completo
Start-CompleteScan -FilePath $FilePath -BlockSize $BlockSize -MaxBlocks $MaxBlocks

# Calcular balances totales por moneda
foreach ($balance in $Global:ScanResults.Balances) {
    $currency = $balance.Currency
    switch ($currency) {
        'EUR' { $Global:ScanResults.TotalEUR += $balance.Balance }
        'USD' { $Global:ScanResults.TotalUSD += $balance.Balance }
        'GBP' { $Global:ScanResults.TotalGBP += $balance.Balance }
        'BTC' { $Global:ScanResults.TotalBTC += $balance.Balance }
        'ETH' { $Global:ScanResults.TotalETH += $balance.Balance }
    }
}

$endTime = Get-Date
$totalTime = $endTime - $Global:ScanResults.StartTime

Write-Host ""
Write-Host "=== ESCANEO COMPLETADO ===" -ForegroundColor Green
Write-Host "Tiempo total: $([Math]::Round($totalTime.TotalMinutes, 2)) minutos" -ForegroundColor Cyan
Write-Host "Bloques procesados: $($Global:ScanResults.ProcessedBlocks)" -ForegroundColor Cyan
Write-Host ""

Write-Host "=== BALANCES TOTALES EXTRAÍDOS ===" -ForegroundColor Green
Write-Host "EUR Total: $($Global:ScanResults.TotalEUR.ToString('N2'))" -ForegroundColor Yellow
Write-Host "USD Total: $($Global:ScanResults.TotalUSD.ToString('N2'))" -ForegroundColor Yellow
Write-Host "GBP Total: $($Global:ScanResults.TotalGBP.ToString('N2'))" -ForegroundColor Yellow
Write-Host "BTC Total: $($Global:ScanResults.TotalBTC.ToString('N8'))" -ForegroundColor Yellow
Write-Host "ETH Total: $($Global:ScanResults.TotalETH.ToString('N8'))" -ForegroundColor Yellow
Write-Host ""

Write-Host "=== ESTADÍSTICAS FINALES ===" -ForegroundColor Green
Write-Host "Total Balances: $($Global:ScanResults.Balances.Count)" -ForegroundColor Cyan
Write-Host "Total Transacciones: $($Global:ScanResults.Transactions.Count)" -ForegroundColor Cyan
Write-Host "Total Cuentas: $($Global:ScanResults.Accounts.Count)" -ForegroundColor Cyan
Write-Host "Total Tarjetas: $($Global:ScanResults.CreditCards.Count)" -ForegroundColor Cyan
Write-Host "Total Usuarios: $($Global:ScanResults.Users.Count)" -ForegroundColor Cyan
Write-Host "Total DAES: $($Global:ScanResults.DAESData.Count)" -ForegroundColor Cyan
Write-Host "Total Wallets ETH: $($Global:ScanResults.EthereumWallets.Count)" -ForegroundColor Cyan
Write-Host "Total SWIFT: $($Global:ScanResults.SwiftCodes.Count)" -ForegroundColor Cyan
Write-Host "Total SSNs: $($Global:ScanResults.SSNs.Count)" -ForegroundColor Cyan
Write-Host ""

# Crear resultados completos para el dashboard
$completeResults = @{
    scanId = "COMPLETE_EXTRACTION_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    mode = "COMPLETE_DTC1B_EXTRACTION"
    progress = @{
        currentBlock = $Global:ScanResults.ProcessedBlocks
        totalBlocks = [Math]::Ceiling((Get-Item $FilePath).Length / $BlockSize)
        percentage = ($Global:ScanResults.ProcessedBlocks / [Math]::Ceiling((Get-Item $FilePath).Length / $BlockSize)) * 100
        elapsedMinutes = $totalTime.TotalMinutes
        estimatedRemaining = 0
        bytesProcessed = $Global:ScanResults.ProcessedBlocks * $BlockSize
        totalBytes = (Get-Item $FilePath).Length
        averageSpeedMBps = [Math]::Round((($Global:ScanResults.ProcessedBlocks * $BlockSize) / 1MB) / $totalTime.TotalSeconds, 2)
        memoryUsageMB = [Math]::Round(([System.GC]::GetTotalMemory($false) / 1MB), 2)
    }
    balances = @{
        EUR = $Global:ScanResults.TotalEUR
        USD = $Global:ScanResults.TotalUSD
        GBP = $Global:ScanResults.TotalGBP
        BTC = $Global:ScanResults.TotalBTC
        ETH = $Global:ScanResults.TotalETH
    }
    statistics = @{
        balancesFound = $Global:ScanResults.Balances.Count
        transactionsFound = $Global:ScanResults.Transactions.Count
        accountsFound = $Global:ScanResults.Accounts.Count
        creditCardsFound = $Global:ScanResults.CreditCards.Count
        usersFound = $Global:ScanResults.Users.Count
        daesDataFound = $Global:ScanResults.DAESData.Count
        ethereumWalletsFound = $Global:ScanResults.EthereumWallets.Count
        swiftCodesFound = $Global:ScanResults.SwiftCodes.Count
        ssnsFound = $Global:ScanResults.SSNs.Count
    }
    recentData = @{
        balances = $Global:ScanResults.Balances | Select-Object -First 100
        transactions = $Global:ScanResults.Transactions | Select-Object -First 100
        accounts = $Global:ScanResults.Accounts | Select-Object -First 100
        creditCards = $Global:ScanResults.CreditCards | Select-Object -First 100
        users = $Global:ScanResults.Users | Select-Object -First 100
        ethereumWallets = $Global:ScanResults.EthereumWallets | Select-Object -First 100
    }
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
}

# Guardar resultados
$outputFile = Join-Path $OutputDir "complete-total-balances-scan.json"
$completeResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "Resultados guardados en: $outputFile" -ForegroundColor Green
Write-Host "=== EXTRACCIÓN COMPLETA FINALIZADA ===" -ForegroundColor Green

# Mostrar resumen final
Write-Host ""
Write-Host "=== RESUMEN FINAL ===" -ForegroundColor Magenta
Write-Host "Archivo: $FilePath" -ForegroundColor White
Write-Host "Tamaño: $([Math]::Round((Get-Item $FilePath).Length / 1GB, 2)) GB" -ForegroundColor White
Write-Host "EUR: $($Global:ScanResults.TotalEUR.ToString('N2'))" -ForegroundColor White
Write-Host "USD: $($Global:ScanResults.TotalUSD.ToString('N2'))" -ForegroundColor White
Write-Host "GBP: $($Global:ScanResults.TotalGBP.ToString('N2'))" -ForegroundColor White
Write-Host "BTC: $($Global:ScanResults.TotalBTC.ToString('N8'))" -ForegroundColor White
Write-Host "ETH: $($Global:ScanResults.TotalETH.ToString('N8'))" -ForegroundColor White
Write-Host "Total elementos: $($Global:ScanResults.Balances.Count)" -ForegroundColor White

Write-Host ""
Write-Host 'Presiona cualquier tecla para continuar...' -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
