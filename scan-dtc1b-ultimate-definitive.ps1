# SCRIPT DTC1B ULTIMATE DEFINITIVO - SOLUCIÓN INTEGRAL OPTIMIZADA
param(
    [string]$FilePath = "E:\final AAAA\dtc1b",
    [int]$BlockSize = 500MB,
    [string]$OutputDir = "E:\final AAAA\corebanking\extracted-data",
    [int]$UpdateInterval = 5,
    [string]$ApiBase = "http://localhost:8080"
)

Write-Host "=== SCRIPT DTC1B ULTIMATE DEFINITIVO ===" -ForegroundColor Cyan
Write-Host "Archivo: $FilePath" -ForegroundColor Yellow
Write-Host "Tamaño: $([math]::Round((Get-Item $FilePath).Length/1GB, 2)) GB" -ForegroundColor Yellow
Write-Host "Bloque: $([math]::Round($BlockSize/1MB, 1)) MB" -ForegroundColor Yellow
Write-Host "Salida: $OutputDir" -ForegroundColor Yellow
Write-Host "API: $ApiBase" -ForegroundColor Yellow

# Crear directorio de salida
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "Directorio creado: $OutputDir" -ForegroundColor Green
}

# Variables globales optimizadas con ArrayList
$Global:ScanData = @{
    Balances = New-Object System.Collections.ArrayList
    Transactions = New-Object System.Collections.ArrayList
    Accounts = New-Object System.Collections.ArrayList
    CreditCards = New-Object System.Collections.ArrayList
    Users = New-Object System.Collections.ArrayList
    DAESData = New-Object System.Collections.ArrayList
    SWIFTCodes = New-Object System.Collections.ArrayList
    SSNs = New-Object System.Collections.ArrayList
    TotalEUR = 0.0
    TotalUSD = 0.0
    TotalGBP = 0.0
    ProcessedBlocks = 0
    StartTime = Get-Date
    ScanId = "SCAN_" + (Get-Date -Format "yyyyMMdd_HHmmss")
}

# Métricas de rendimiento avanzadas
$Global:PerformanceMetrics = @{
    StartTime = Get-Date
    BytesProcessed = 0
    BlocksProcessed = 0
    AverageSpeed = 0
    MemoryUsage = 0
    Errors = 0
    Warnings = 0
    DataExtracted = 0
    LastUpdate = Get-Date
}

# Regex compilados para máximo rendimiento
$CompiledPatterns = @{
    Balance = [regex]::new('(?i)(?:balance|saldo|amount|monto|total)[:\s]*([0-9,]+\.?[0-9]*)', 'Compiled')
    EUR = [regex]::new('(?i)(?:EUR|euro)[:\s]*([0-9,]+\.?[0-9]*)', 'Compiled')
    USD = [regex]::new('(?i)(?:USD|dollar)[:\s]*([0-9,]+\.?[0-9]*)', 'Compiled')
    GBP = [regex]::new('(?i)(?:GBP|pound)[:\s]*([0-9,]+\.?[0-9]*)', 'Compiled')
    Account = [regex]::new('(?i)(?:account|iban|acc|cuenta)[:\s]*([A-Z0-9\-]{8,})', 'Compiled')
    IBAN = [regex]::new('(?i)(?:ES|US|GB|FR|DE)[0-9]{2}[A-Z0-9]{20,}', 'Compiled')
    CreditCard = [regex]::new('([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})', 'Compiled')
    CVV = [regex]::new('(?i)(?:cvv|cvc|cvv2)[:\s]*([0-9]{3,4})', 'Compiled')
    User = [regex]::new('(?i)(?:user|username|email|customer)[:\s]*([A-Za-z0-9_\-\.@]+)', 'Compiled')
    Transaction = [regex]::new('(?i)(?:transfer|payment|deposit|withdrawal)[:\s]*([0-9,]+\.?[0-9]*)', 'Compiled')
    DAES = [regex]::new('(?i)(?:DAES|AES|encrypted|cipher)[:\s]*([A-Za-z0-9+/=]{20,})', 'Compiled')
    SWIFT = [regex]::new('(?i)(?:SWIFT|BIC)[:\s]*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)', 'Compiled')
    SSN = [regex]::new('(?i)(?:ssn|social)[:\s]*([0-9]{3}-[0-9]{2}-[0-9]{4})', 'Compiled')
}

# Sistema de logging avanzado
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    Write-Host $logEntry -ForegroundColor $(switch($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        "INFO" { "Cyan" }
        default { "White" }
    })
    
    $logEntry | Out-File -Append (Join-Path $OutputDir "scan-log.txt") -Encoding UTF8
}

# Validación de tarjeta de crédito con algoritmo Luhn
function Test-CreditCard {
    param([string]$cardNumber)
    try {
        $cardNumber = $cardNumber -replace '[\s\-]', ''
        if ($cardNumber.Length -ne 16 -or $cardNumber -notmatch '^[0-9]+$') {
            return $false
        }
        
        $sum = 0
        $alternate = $false
        for ($i = $cardNumber.Length - 1; $i -ge 0; $i--) {
            $n = [int]$cardNumber[$i]
            if ($alternate) {
                $n *= 2
                if ($n -gt 9) { $n = ($n % 10) + 1 }
            }
            $sum += $n
            $alternate = -not $alternate
        }
        return ($sum % 10 -eq 0)
    }
    catch {
        return $false
    }
}

# Validación IBAN avanzada
function Test-IBAN {
    param([string]$iban)
    try {
        $iban = $iban.ToUpper() -replace '[\s\-]', ''
        if ($iban.Length -lt 15 -or $iban.Length -gt 34) {
            return $false
        }
        
        $rearranged = $iban.Substring(4) + $iban.Substring(0, 4)
        $numericString = ""
        foreach ($char in $rearranged.ToCharArray()) {
            if ($char -match '[A-Z]') {
                $numericString += ([int]$char - 55).ToString()
            } else {
                $numericString += $char
            }
        }
        
        $remainder = 0
        foreach ($char in $numericString.ToCharArray()) {
            $remainder = ($remainder * 10 + [int]$char) % 97
        }
        
        return ($remainder -eq 1)
    }
    catch {
        return $false
    }
}

# Decodificación DAES mejorada con múltiples algoritmos
function Decode-DAES {
    param([string]$content, [int]$blockNum)
    
    $daesResults = New-Object System.Collections.ArrayList
    $matches = $CompiledPatterns.DAES.Matches($content)
    
    foreach ($match in $matches) {
        $encrypted = $match.Groups[1].Value.Trim()
        $decoded = $null
        $decodingMethod = "NONE"
        
        try {
            $decoded = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($encrypted))
            $decodingMethod = "BASE64"
        }
        catch {
            try {
                $bytes = [System.Convert]::FromHexString($encrypted)
                $decoded = [System.Text.Encoding]::UTF8.GetString($bytes)
                $decodingMethod = "HEX"
            }
            catch {
                $decoded = $encrypted
                $decodingMethod = "TEXT"
            }
        }
        
        $daesResults.Add(@{
            Type = "DAES"
            Original = $encrypted
            Decoded = $decoded
            Method = $decodingMethod
            Block = $blockNum
            Position = $match.Index
            Timestamp = Get-Date
            ScanId = $Global:ScanData.ScanId
        }) | Out-Null
    }
    
    return $daesResults
}

# Función para detectar moneda con contexto amplio
function Detect-Currency {
    param([string]$content, [int]$position)
    
    $context = $content.Substring([math]::Max(0, $position - 300), 600)
    if ($context -match '(?i)(?:EUR|euro)') { return "EUR" }
    elseif ($context -match '(?i)(?:USD|dollar)') { return "USD" }
    elseif ($context -match '(?i)(?:GBP|pound)') { return "GBP" }
    return "EUR"
}

# Función para encontrar CVV optimizada
function Find-NearbyCVV {
    param([string]$content, [int]$position)
    
    $context = $content.Substring([math]::Max(0, $position - 500), 1000)
    $matches = $CompiledPatterns.CVV.Matches($context)
    foreach ($match in $matches) {
        return $match.Groups[1].Value
    }
    return "N/A"
}

# Función para extraer datos financieros ultra optimizada
function Extract-FinancialData {
    param([string]$content, [int]$blockNum)
    
    $found = @{
        Balances = New-Object System.Collections.ArrayList
        Transactions = New-Object System.Collections.ArrayList
        Accounts = New-Object System.Collections.ArrayList
        CreditCards = New-Object System.Collections.ArrayList
        Users = New-Object System.Collections.ArrayList
        SWIFTCodes = New-Object System.Collections.ArrayList
        SSNs = New-Object System.Collections.ArrayList
    }
    
    Write-Log "Procesando bloque $blockNum - Tamaño: $($content.Length) caracteres" "INFO"
    
    # Extraer balances con regex compilados
    $balancePatterns = @($CompiledPatterns.Balance, $CompiledPatterns.EUR, $CompiledPatterns.USD, $CompiledPatterns.GBP)
    foreach ($pattern in $balancePatterns) {
        $matches = $pattern.Matches($content)
        Write-Log "  Encontrados $($matches.Count) matches para patrón balance" "INFO"
        
        foreach ($match in $matches) {
            $value = $match.Groups[1].Value.Trim()
            if ($value -match '^[0-9,]+\.?[0-9]*$' -and $value.Length -gt 0) {
                $balance = [double]($value -replace ',', '')
                $currency = Detect-Currency $content $match.Index
                
                $found.Balances.Add(@{
                    Block = $blockNum
                    Balance = $balance
                    Currency = $currency
                    Position = $match.Index
                    RawValue = $value
                    Pattern = $pattern.ToString()
                    Timestamp = Get-Date
                    ScanId = $Global:ScanData.ScanId
                }) | Out-Null
                
                Write-Log "    Balance encontrado: $currency $balance" "SUCCESS"
            }
        }
    }
    
    # Extraer cuentas con validación IBAN
    $accountPatterns = @($CompiledPatterns.Account, $CompiledPatterns.IBAN)
    foreach ($pattern in $accountPatterns) {
        $matches = $pattern.Matches($content)
        Write-Log "  Encontrados $($matches.Count) matches para patrón cuenta" "INFO"
        
        foreach ($match in $matches) {
            $value = $match.Groups[1].Value.Trim()
            if ($value.Length -gt 8) {
                $isValidIBAN = Test-IBAN $value
                $found.Accounts.Add(@{
                    Block = $blockNum
                    AccountNumber = $value
                    IsValidIBAN = $isValidIBAN
                    Position = $match.Index
                    Pattern = $pattern.ToString()
                    Timestamp = Get-Date
                    ScanId = $Global:ScanData.ScanId
                }) | Out-Null
                
                Write-Log "    Cuenta encontrada: $value (IBAN válido: $isValidIBAN)" "SUCCESS"
            }
        }
    }
    
    # Extraer tarjetas de crédito con validación Luhn
    $matches = $CompiledPatterns.CreditCard.Matches($content)
    Write-Log "  Encontrados $($matches.Count) matches para tarjetas" "INFO"
    
    foreach ($match in $matches) {
        $cardNumber = $match.Value.Trim() -replace '[\s\-]', ''
        if ($cardNumber.Length -eq 16) {
            $isValidCard = Test-CreditCard $cardNumber
            $cvv = Find-NearbyCVV $content $match.Index
            $found.CreditCards.Add(@{
                Block = $blockNum
                CardNumber = $cardNumber
                CVV = $cvv
                IsValidCard = $isValidCard
                Position = $match.Index
                Timestamp = Get-Date
                ScanId = $Global:ScanData.ScanId
            }) | Out-Null
            
            Write-Log "    Tarjeta encontrada: $cardNumber (Válida: $isValidCard, CVV: $cvv)" "SUCCESS"
        }
    }
    
    # Extraer usuarios
    $matches = $CompiledPatterns.User.Matches($content)
    Write-Log "  Encontrados $($matches.Count) matches para usuarios" "INFO"
    
    foreach ($match in $matches) {
        $value = $match.Groups[1].Value.Trim()
        if ($value.Length -gt 2 -and $value -match '@') {
            $found.Users.Add(@{
                Block = $blockNum
                Username = $value
                Position = $match.Index
                Timestamp = Get-Date
                ScanId = $Global:ScanData.ScanId
            }) | Out-Null
            
            Write-Log "    Usuario encontrado: $value" "SUCCESS"
        }
    }
    
    # Extraer transacciones
    $matches = $CompiledPatterns.Transaction.Matches($content)
    Write-Log "  Encontrados $($matches.Count) matches para transacciones" "INFO"
    
    foreach ($match in $matches) {
        $value = $match.Groups[1].Value.Trim()
        if ($value -match '^[0-9,]+\.?[0-9]*$' -and $value.Length -gt 0) {
            $amount = [double]($value -replace ',', '')
            $currency = Detect-Currency $content $match.Index
            $found.Transactions.Add(@{
                Block = $blockNum
                Amount = $amount
                Currency = $currency
                Position = $match.Index
                RawValue = $value
                Timestamp = Get-Date
                ScanId = $Global:ScanData.ScanId
            }) | Out-Null
            
            Write-Log "    Transacción encontrada: $currency $amount" "SUCCESS"
        }
    }
    
    # Extraer códigos SWIFT
    $matches = $CompiledPatterns.SWIFT.Matches($content)
    foreach ($match in $matches) {
        $value = $match.Groups[1].Value.Trim()
        if ($value.Length -ge 8) {
            $found.SWIFTCodes.Add(@{
                Block = $blockNum
                SWIFTCode = $value
                Position = $match.Index
                Timestamp = Get-Date
                ScanId = $Global:ScanData.ScanId
            }) | Out-Null
        }
    }
    
    # Extraer SSN
    $matches = $CompiledPatterns.SSN.Matches($content)
    foreach ($match in $matches) {
        $value = $match.Groups[1].Value.Trim()
        $found.SSNs.Add(@{
            Block = $blockNum
            SSN = $value
            Position = $match.Index
            Timestamp = Get-Date
            ScanId = $Global:ScanData.ScanId
        }) | Out-Null
    }
    
    return $found
}

# Función para actualizar métricas de rendimiento
function Update-PerformanceMetrics {
    param([int]$bytesProcessed, [int]$blocksProcessed, [int]$dataExtracted)
    
    $currentTime = Get-Date
    $elapsed = $currentTime - $Global:PerformanceMetrics.StartTime
    $Global:PerformanceMetrics.BytesProcessed += $bytesProcessed
    $Global:PerformanceMetrics.BlocksProcessed += $blocksProcessed
    $Global:PerformanceMetrics.DataExtracted += $dataExtracted
    
    if ($elapsed.TotalSeconds -gt 0) {
        $Global:PerformanceMetrics.AverageSpeed = $Global:PerformanceMetrics.BytesProcessed / $elapsed.TotalSeconds / 1MB
    }
    
    $Global:PerformanceMetrics.MemoryUsage = [System.GC]::GetTotalMemory($false) / 1MB
    $Global:PerformanceMetrics.LastUpdate = $currentTime
}

# Función para enviar datos a la API
function Send-ToAPI {
    param($data, [string]$endpoint)
    
    try {
        $jsonData = $data | ConvertTo-Json -Depth 10
        $response = Invoke-RestMethod -Uri "$ApiBase/api/v1/data/$endpoint" -Method POST -Body $jsonData -ContentType "application/json" -TimeoutSec 5
        Write-Log "Datos enviados a API: $endpoint" "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Error enviando datos a API: $($_.Exception.Message)" "WARN"
        return $false
    }
}

# Función para actualizar datos en tiempo real con integración API
function Update-RealtimeData {
    param([int]$currentBlock, [int]$totalBlocks)
    
    $currentTime = Get-Date
    $elapsed = $currentTime - $Global:ScanData.StartTime
    $percent = [math]::Round(($currentBlock / $totalBlocks) * 100, 2)
    
    # Crear datos para dashboard
    $dashboardData = @{
        timestamp = $currentTime.ToString("yyyy-MM-dd HH:mm:ss")
        scanId = $Global:ScanData.ScanId
        progress = @{
            currentBlock = $currentBlock
            totalBlocks = $totalBlocks
            percentage = $percent
            elapsedMinutes = [math]::Round($elapsed.TotalMinutes, 2)
            estimatedRemaining = if ($currentBlock -gt 0) { [math]::Round(($elapsed.TotalMinutes / $currentBlock) * ($totalBlocks - $currentBlock), 2) } else { 0 }
        }
        balances = @{
            EUR = $Global:ScanData.TotalEUR
            USD = $Global:ScanData.TotalUSD
            GBP = $Global:ScanData.TotalGBP
        }
        performance = @{
            averageSpeedMBps = [math]::Round($Global:PerformanceMetrics.AverageSpeed, 2)
            memoryUsageMB = [math]::Round($Global:PerformanceMetrics.MemoryUsage, 2)
            bytesProcessed = $Global:PerformanceMetrics.BytesProcessed
            blocksProcessed = $Global:PerformanceMetrics.BlocksProcessed
            dataExtracted = $Global:PerformanceMetrics.DataExtracted
        }
        statistics = @{
            balancesFound = $Global:ScanData.Balances.Count
            transactionsFound = $Global:ScanData.Transactions.Count
            accountsFound = $Global:ScanData.Accounts.Count
            creditCardsFound = $Global:ScanData.CreditCards.Count
            usersFound = $Global:ScanData.Users.Count
            daesDataFound = $Global:ScanData.DAESData.Count
            swiftCodesFound = $Global:ScanData.SWIFTCodes.Count
            ssnsFound = $Global:ScanData.SSNs.Count
        }
        recentData = @{
            balances = $Global:ScanData.Balances | Select-Object -Last 10
            transactions = $Global:ScanData.Transactions | Select-Object -Last 10
            accounts = $Global:ScanData.Accounts | Select-Object -Last 10
            creditCards = $Global:ScanData.CreditCards | Select-Object -Last 10
            users = $Global:ScanData.Users | Select-Object -Last 10
        }
    }
    
    # Guardar archivos locales
    $dashboardData | ConvertTo-Json -Depth 10 | Out-File (Join-Path $OutputDir "dashboard-data.json") -Encoding UTF8
    $dashboardData | ConvertTo-Json -Depth 10 | Out-File (Join-Path $OutputDir "realtime-balances.json") -Encoding UTF8
    
    # Enviar a API si está disponible
    Send-ToAPI $dashboardData "realtime" | Out-Null
    
    # Mostrar progreso detallado
    Write-Log "=== ACTUALIZACION TIEMPO REAL ===" "INFO"
    Write-Log "Bloque: $currentBlock de $totalBlocks ($percent%)" "INFO"
    Write-Log "EUR: $($Global:ScanData.TotalEUR.ToString('N2')) | USD: $($Global:ScanData.TotalUSD.ToString('N2')) | GBP: $($Global:ScanData.TotalGBP.ToString('N2'))" "SUCCESS"
    Write-Log "Balances: $($Global:ScanData.Balances.Count) | Transacciones: $($Global:ScanData.Transactions.Count) | Cuentas: $($Global:ScanData.Accounts.Count)" "INFO"
    Write-Log "Tarjetas: $($Global:ScanData.CreditCards.Count) | Usuarios: $($Global:ScanData.Users.Count) | DAES: $($Global:ScanData.DAESData.Count)" "INFO"
    Write-Log "Velocidad: $([math]::Round($Global:PerformanceMetrics.AverageSpeed, 2)) MB/s | Memoria: $([math]::Round($Global:PerformanceMetrics.MemoryUsage, 2)) MB" "INFO"
    Write-Log "Tiempo: $([math]::Round($elapsed.TotalMinutes, 2)) min" "INFO"
}

# Función principal ultra optimizada
function Start-UltimateScan {
    try {
        Write-Log "Iniciando escaneo ultimate definitivo" "INFO"
        
        $fileInfo = Get-Item $FilePath
        $fileSize = $fileInfo.Length
        $totalBlocks = [math]::Ceiling($fileSize / $BlockSize)
        
        Write-Log "Archivo: $([math]::Round($fileSize/1GB, 2)) GB" "INFO"
        Write-Log "Bloques: $totalBlocks" "INFO"
        Write-Log "Tamaño de bloque: $([math]::Round($BlockSize/1MB, 1)) MB" "INFO"
        Write-Log "Modo ULTIMATE DEFINITIVO: Activado" "SUCCESS"
        Write-Log "Scan ID: $($Global:ScanData.ScanId)" "INFO"
        
        $stream = [System.IO.File]::OpenRead($FilePath)
        $reader = New-Object System.IO.StreamReader($stream)
        
        # Procesamiento ultra optimizado
        for ($block = 0; $block -lt $totalBlocks; $block++) {
            $buffer = New-Object char[] $BlockSize
            $bytesRead = $reader.Read($buffer, 0, $BlockSize)
            $content = [string]::new($buffer, 0, $bytesRead)
            
            # Mostrar progreso
            $percent = [math]::Round((($block + 1) / $totalBlocks) * 100, 2)
            Write-Progress -Activity "Escaneo Ultimate DTC1B" -Status "Bloque $($block + 1) de $totalBlocks ($percent%)" -PercentComplete $percent
            
            Write-Log "Procesando bloque $($block + 1) de $totalBlocks" "INFO"
            
            # Procesar datos
            $daesData = Decode-DAES $content $block
            $financialData = Extract-FinancialData $content $block
            
            # Acumular datos
            if ($financialData.Balances) { $Global:ScanData.Balances.AddRange($financialData.Balances) }
            if ($financialData.Transactions) { $Global:ScanData.Transactions.AddRange($financialData.Transactions) }
            if ($financialData.Accounts) { $Global:ScanData.Accounts.AddRange($financialData.Accounts) }
            if ($financialData.CreditCards) { $Global:ScanData.CreditCards.AddRange($financialData.CreditCards) }
            if ($financialData.Users) { $Global:ScanData.Users.AddRange($financialData.Users) }
            if ($financialData.SWIFTCodes) { $Global:ScanData.SWIFTCodes.AddRange($financialData.SWIFTCodes) }
            if ($financialData.SSNs) { $Global:ScanData.SSNs.AddRange($financialData.SSNs) }
            if ($daesData) { $Global:ScanData.DAESData.AddRange($daesData) }
            $Global:ScanData.ProcessedBlocks++
            
            # Actualizar totales
            foreach ($balance in $financialData.Balances) {
                switch ($balance.Currency) {
                    "EUR" { $Global:ScanData.TotalEUR += $balance.Balance }
                    "USD" { $Global:ScanData.TotalUSD += $balance.Balance }
                    "GBP" { $Global:ScanData.TotalGBP += $balance.Balance }
                }
            }
            
            # Actualizar métricas
            $dataExtracted = $financialData.Balances.Count + $financialData.Transactions.Count + $financialData.Accounts.Count + $financialData.CreditCards.Count + $financialData.Users.Count + $daesData.Count
            Update-PerformanceMetrics $bytesRead 1 $dataExtracted
            
            # Actualizar en tiempo real
            if (($block + 1) % $UpdateInterval -eq 0) {
                Update-RealtimeData ($block + 1) $totalBlocks
            }
            
            # Optimización de memoria cada 10 bloques
            if (($block + 1) % 10 -eq 0) {
                [System.GC]::Collect()
                [System.GC]::WaitForPendingFinalizers()
            }
        }
        
        $reader.Close()
        $stream.Close()
        
        Write-Progress -Activity "Escaneo Ultimate DTC1B" -Completed
        
        # Actualización final
        Update-RealtimeData $totalBlocks $totalBlocks
        
        # Mostrar resultados finales
        Write-Log "=== ESCANEO ULTIMATE DEFINITIVO COMPLETADO ===" "SUCCESS"
        Write-Log "Bloques procesados: $($Global:ScanData.ProcessedBlocks)" "SUCCESS"
        Write-Log "Tiempo total: $([math]::Round(((Get-Date) - $Global:ScanData.StartTime).TotalMinutes, 2)) minutos" "SUCCESS"
        
        Write-Log "=== RESULTADOS FINALES ===" "INFO"
        Write-Log "Total EUR: $($Global:ScanData.TotalEUR.ToString('N2'))" "SUCCESS"
        Write-Log "Total USD: $($Global:ScanData.TotalUSD.ToString('N2'))" "SUCCESS"
        Write-Log "Total GBP: $($Global:ScanData.TotalGBP.ToString('N2'))" "SUCCESS"
        
        Write-Log "=== ESTADISTICAS FINALES ===" "INFO"
        Write-Log "Balances encontrados: $($Global:ScanData.Balances.Count)" "INFO"
        Write-Log "Transacciones encontradas: $($Global:ScanData.Transactions.Count)" "INFO"
        Write-Log "Cuentas encontradas: $($Global:ScanData.Accounts.Count)" "INFO"
        Write-Log "Tarjetas encontradas: $($Global:ScanData.CreditCards.Count)" "INFO"
        Write-Log "Usuarios encontrados: $($Global:ScanData.Users.Count)" "INFO"
        Write-Log "Datos DAES decodificados: $($Global:ScanData.DAESData.Count)" "INFO"
        Write-Log "Códigos SWIFT encontrados: $($Global:ScanData.SWIFTCodes.Count)" "INFO"
        Write-Log "SSN encontrados: $($Global:ScanData.SSNs.Count)" "INFO"
        
        # Guardar resultados finales
        $finalResults = @{
            ScanInfo = @{
                ScanId = $Global:ScanData.ScanId
                FilePath = $FilePath
                FileSize = $fileSize
                TotalBlocks = $totalBlocks
                BlockSize = $BlockSize
                ProcessedBlocks = $Global:ScanData.ProcessedBlocks
                StartTime = $Global:ScanData.StartTime
                EndTime = Get-Date
                TotalTime = ((Get-Date) - $Global:ScanData.StartTime).TotalMinutes
                UltimateMode = $true
                PerformanceMetrics = $Global:PerformanceMetrics
            }
            FinancialData = @{
                Balances = $Global:ScanData.Balances
                Transactions = $Global:ScanData.Transactions
                Accounts = $Global:ScanData.Accounts
                CreditCards = $Global:ScanData.CreditCards
                Users = $Global:ScanData.Users
                SWIFTCodes = $Global:ScanData.SWIFTCodes
                SSNs = $Global:ScanData.SSNs
            }
            DecodedData = @{
                DAESData = $Global:ScanData.DAESData
            }
            Totals = @{
                EUR = $Global:ScanData.TotalEUR
                USD = $Global:ScanData.TotalUSD
                GBP = $Global:ScanData.TotalGBP
            }
        }
        
        $finalResults | ConvertTo-Json -Depth 10 | Out-File (Join-Path $OutputDir "ultimate-definitive-results.json") -Encoding UTF8
        
        # Enviar resultados finales a API
        Send-ToAPI $finalResults "final" | Out-Null
        
        Write-Log "Archivos guardados:" "INFO"
        Write-Log "Resultados finales: $OutputDir\ultimate-definitive-results.json" "SUCCESS"
        Write-Log "Datos dashboard: $OutputDir\dashboard-data.json" "SUCCESS"
        Write-Log "Balances tiempo real: $OutputDir\realtime-balances.json" "SUCCESS"
        Write-Log "Log de escaneo: $OutputDir\scan-log.txt" "SUCCESS"
        
        Write-Log "ESCANEO ULTIMATE DEFINITIVO COMPLETADO EXITOSAMENTE" "SUCCESS"
        
    }
    catch {
        Write-Log "Error en escaneo: $($_.Exception.Message)" "ERROR"
        Write-Log "Stack trace: $($_.Exception.StackTrace)" "ERROR"
        $Global:PerformanceMetrics.Errors++
    }
    finally {
        if ($reader) { $reader.Close() }
        if ($stream) { $stream.Close() }
    }
}

# Ejecutar escaneo ultimate definitivo
Start-UltimateScan

