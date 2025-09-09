# Script completo para escanear 800 GB con decodificacion binaria y DAES
param(
    [string]$LargeFilePath = "E:\final AAAA\dtc1b",
    [int]$BlockSize = 10MB,
    [string]$OutputPath = "E:\final AAAA\corebanking\extracted-data"
)

Write-Host "=== ESCANEO COMPLETO 800 GB CON DECODIFICACION ===" -ForegroundColor Cyan
Write-Host "Archivo: $LargeFilePath" -ForegroundColor Yellow
Write-Host "Tamano de bloque: $([math]::Round($BlockSize/1MB, 2)) MB" -ForegroundColor Yellow
Write-Host "Directorio de salida: $OutputPath" -ForegroundColor Yellow

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
    BinaryData = @()
    TotalEUR = 0
    TotalUSD = 0
    TotalGBP = 0
    ProcessedBlocks = 0
    StartTime = Get-Date
}

# Funcion para decodificar binario
function Decode-BinaryData {
    param(
        [byte[]]$binaryData,
        [string]$blockNumber
    )
    
    $decodedData = @()
    
    try {
        # Intentar decodificar como UTF-8
        $utf8String = [System.Text.Encoding]::UTF8.GetString($binaryData)
        if ($utf8String -match '[A-Za-z0-9]') {
            $decodedData += @{
                Type = "UTF-8"
                Data = $utf8String
                Block = $blockNumber
            }
        }
        
        # Intentar decodificar como ASCII
        $asciiString = [System.Text.Encoding]::ASCII.GetString($binaryData)
        if ($asciiString -match '[A-Za-z0-9]') {
            $decodedData += @{
                Type = "ASCII"
                Data = $asciiString
                Block = $blockNumber
            }
        }
        
        # Intentar decodificar como Base64
        try {
            $base64String = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($asciiString))
            if ($base64String -match '[A-Za-z0-9]') {
                $decodedData += @{
                    Type = "Base64"
                    Data = $base64String
                    Block = $blockNumber
                }
            }
        }
        catch {
            # No es Base64 válido
        }
        
    }
    catch {
        Write-Host "Error decodificando binario en bloque $blockNumber : $($_.Exception.Message)" -ForegroundColor Red
    }
    
    return $decodedData
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
                
                Write-Host "DAES decodificado en bloque $blockNumber : $($decodedString.Substring(0, [Math]::Min(50, $decodedString.Length)))..." -ForegroundColor Green
                
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
            'monto[:\s]+([0-9,]+\.?[0-9]*)'
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
                            }
                        }
                    }
                    
                    "User" {
                        if ($value.Length -gt 2) {
                            $financialData.Users += @{
                                Block = $blockNumber
                                Username = $value
                                Position = $match.Index
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

# Funcion para mostrar progreso en tiempo real
function Show-RealTimeProgress {
    param(
        [int]$currentBlock,
        [int]$totalBlocks,
        [string]$blockInfo
    )
    
    $percentComplete = [math]::Round(($currentBlock / $totalBlocks) * 100, 2)
    $elapsedTime = (Get-Date) - $globalData.StartTime
    $estimatedTotal = if ($percentComplete -gt 0) { $elapsedTime.TotalSeconds / ($percentComplete / 100) } else { 0 }
    $estimatedRemaining = $estimatedTotal - $elapsedTime.TotalSeconds
    
    Write-Host "`n=== PROGRESO EN TIEMPO REAL ===" -ForegroundColor Cyan
    Write-Host "Bloque: $currentBlock de $totalBlocks ($percentComplete%)" -ForegroundColor Yellow
    Write-Host "Tiempo transcurrido: $([math]::Round($elapsedTime.TotalMinutes, 2)) minutos" -ForegroundColor Yellow
    Write-Host "Tiempo estimado restante: $([math]::Round($estimatedRemaining / 60, 2)) minutos" -ForegroundColor Yellow
    Write-Host "Informacion del bloque: $blockInfo" -ForegroundColor Yellow
    
    Write-Host "`n=== DATOS ACUMULADOS ===" -ForegroundColor Green
    Write-Host "Total EUR: EUR $($globalData.TotalEUR.ToString('N2'))" -ForegroundColor Green
    Write-Host "Total USD: USD $($globalData.TotalUSD.ToString('N2'))" -ForegroundColor Green
    Write-Host "Total GBP: GBP $($globalData.TotalGBP.ToString('N2'))" -ForegroundColor Green
    Write-Host "Balances encontrados: $($globalData.Balances.Count)" -ForegroundColor Green
    Write-Host "Transacciones encontradas: $($globalData.Transactions.Count)" -ForegroundColor Green
    Write-Host "Cuentas encontradas: $($globalData.Accounts.Count)" -ForegroundColor Green
    Write-Host "Tarjetas encontradas: $($globalData.CreditCards.Count)" -ForegroundColor Green
    Write-Host "Usuarios encontrados: $($globalData.Users.Count)" -ForegroundColor Green
    Write-Host "Datos DAES decodificados: $($globalData.DAESData.Count)" -ForegroundColor Green
    Write-Host "Datos binarios decodificados: $($globalData.BinaryData.Count)" -ForegroundColor Green
}

# Funcion para guardar datos intermedios
function Save-IntermediateData {
    param(
        [string]$blockNumber
    )
    
    $intermediateData = @{
        BlockNumber = $blockNumber
        Timestamp = Get-Date
        Balances = $globalData.Balances
        Transactions = $globalData.Transactions
        Accounts = $globalData.Accounts
        CreditCards = $globalData.CreditCards
        Users = $globalData.Users
        DAESData = $globalData.DAESData
        BinaryData = $globalData.BinaryData
        Totals = @{
            EUR = $globalData.TotalEUR
            USD = $globalData.TotalUSD
            GBP = $globalData.TotalGBP
        }
    }
    
    $fileName = "block-$blockNumber-data.json"
    $filePath = Join-Path $OutputPath $fileName
    $intermediateData | ConvertTo-Json -Depth 10 | Out-File $filePath -Encoding UTF8
    
    Write-Host "Datos intermedios guardados: $fileName" -ForegroundColor Cyan
}

# Iniciar escaneo completo
try {
    $fileInfo = Get-Item $LargeFilePath
    $fileSize = $fileInfo.Length
    $totalBlocks = [math]::Ceiling($fileSize / $BlockSize)
    
    Write-Host "`n=== INICIANDO ESCANEO COMPLETO ===" -ForegroundColor Cyan
    Write-Host "Tamano del archivo: $([math]::Round($fileSize/1GB, 2)) GB" -ForegroundColor Green
    Write-Host "Total de bloques: $totalBlocks" -ForegroundColor Green
    Write-Host "Tamano por bloque: $([math]::Round($BlockSize/1MB, 2)) MB" -ForegroundColor Green
    
    $stream = [System.IO.File]::OpenRead($LargeFilePath)
    $reader = New-Object System.IO.StreamReader($stream)
    
    for ($block = 0; $block -lt $totalBlocks; $block++) {
        $buffer = New-Object char[] $BlockSize
        $bytesRead = $reader.Read($buffer, 0, $BlockSize)
        $content = [string]::new($buffer, 0, $bytesRead)
        
        Write-Progress -Activity "Escaneando archivo 800 GB" -Status "Bloque $($block + 1) de $totalBlocks" -PercentComplete (($block + 1) / $totalBlocks * 100)
        
        # Decodificar datos binarios
        $binaryData = Decode-BinaryData $buffer $block
        
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
        $globalData.BinaryData += $binaryData
        $globalData.ProcessedBlocks++
        
        # Mostrar progreso cada 10 bloques
        if (($block + 1) % 10 -eq 0) {
            $blockInfo = "Balances: $($financialData.Balances.Count), Transacciones: $($financialData.Transactions.Count), DAES: $($daesData.Count)"
            Show-RealTimeProgress ($block + 1) $totalBlocks $blockInfo
            
            # Guardar datos intermedios cada 100 bloques
            if (($block + 1) % 100 -eq 0) {
                Save-IntermediateData ($block + 1)
            }
        }
        
        # Liberar memoria
        [System.GC]::Collect()
    }
    
    $reader.Close()
    $stream.Close()
    
    Write-Progress -Activity "Escaneando archivo 800 GB" -Completed
    
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
    Write-Host "Datos binarios decodificados: $($globalData.BinaryData.Count)" -ForegroundColor White
    
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
            BinaryData = $globalData.BinaryData
        }
        Totals = @{
            EUR = $globalData.TotalEUR
            USD = $globalData.TotalUSD
            GBP = $globalData.TotalGBP
        }
    }
    
    $finalResults | ConvertTo-Json -Depth 10 | Out-File (Join-Path $OutputPath "final-results.json") -Encoding UTF8
    Write-Host "`nResultados finales guardados en: $OutputPath\final-results.json" -ForegroundColor Cyan
    
    # Crear archivo para dashboard
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
        lastUpdate = Get-Date
    }
    
    $dashboardData | ConvertTo-Json -Depth 10 | Out-File (Join-Path $OutputPath "dashboard-data.json") -Encoding UTF8
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
