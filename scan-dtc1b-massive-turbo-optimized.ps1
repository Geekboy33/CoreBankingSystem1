# SCRIPT MASIVO TURBO OPTIMIZADO - VERSION CON BLOQUES OPTIMIZADOS
param(
    [string]$FilePath = "E:\final AAAA\dtc1b",
    [int]$BlockSize = 200MB,
    [string]$OutputDir = "E:\final AAAA\corebanking\extracted-data",
    [int]$UpdateInterval = 3,
    [string]$ApiBase = "http://localhost:8080"
)

Write-Host "=== SCRIPT MASIVO TURBO OPTIMIZADO ===" -ForegroundColor Cyan
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

# Variables globales optimizadas
$Global:ScanData = @{
    Balances = New-Object System.Collections.ArrayList
    Transactions = New-Object System.Collections.ArrayList
    Accounts = New-Object System.Collections.ArrayList
    CreditCards = New-Object System.Collections.ArrayList
    Users = New-Object System.Collections.ArrayList
    DAESData = New-Object System.Collections.ArrayList
    TotalEUR = 0.0
    TotalUSD = 0.0
    TotalGBP = 0.0
    ProcessedBlocks = 0
    StartTime = Get-Date
    ScanId = "MASSIVE_SCAN_" + (Get-Date -Format "yyyyMMdd_HHmmss")
}

# Métricas de rendimiento
$Global:PerformanceMetrics = @{
    StartTime = Get-Date
    BytesProcessed = 0
    BlocksProcessed = 0
    AverageSpeed = 0
    MemoryUsage = 0
    Errors = 0
    DataExtracted = 0
    LastUpdate = Get-Date
}

# Patrones regex optimizados
$Patterns = @{
    Balance = '(?i)(?:balance|saldo|amount|monto|total)[:\s]*([0-9,]+\.?[0-9]*)'
    EUR = '(?i)(?:EUR|euro)[:\s]*([0-9,]+\.?[0-9]*)'
    USD = '(?i)(?:USD|dollar)[:\s]*([0-9,]+\.?[0-9]*)'
    GBP = '(?i)(?:GBP|pound)[:\s]*([0-9,]+\.?[0-9]*)'
    Account = '(?i)(?:account|iban|acc|cuenta)[:\s]*([A-Z0-9\-]{8,})'
    IBAN = '(?i)(?:ES|US|GB|FR|DE)[0-9]{2}[A-Z0-9]{20,}'
    CreditCard = '([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})'
    CVV = '(?i)(?:cvv|cvc|cvv2)[:\s]*([0-9]{3,4})'
    User = '(?i)(?:user|username|email|customer)[:\s]*([A-Za-z0-9_\-\.@]+)'
    Transaction = '(?i)(?:transfer|payment|deposit|withdrawal)[:\s]*([0-9,]+\.?[0-9]*)'
    DAES = '(?i)(?:DAES|AES|encrypted|cipher)[:\s]*([A-Za-z0-9+/=]{20,})'
}

# Sistema de logging
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    Write-Host $logEntry -ForegroundColor $(switch($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        "INFO" { "Cyan" }
        "TURBO" { "Magenta" }
        default { "White" }
    })
    
    $logEntry | Out-File -Append (Join-Path $OutputDir "massive-scan-log.txt") -Encoding UTF8
}

# Validación de tarjeta de crédito
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

# Validación IBAN
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

# Decodificación DAES
function Decode-DAES {
    param([string]$content, [int]$blockNum)
    
    $daesResults = New-Object System.Collections.ArrayList
    $matches = [regex]::Matches($content, $Patterns.DAES)
    
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

# Función para detectar moneda
function Detect-Currency {
    param([string]$content, [int]$position)
    
    $context = $content.Substring([math]::Max(0, $position - 300), 600)
    if ($context -match '(?i)(?:EUR|euro)') { return "EUR" }
    elseif ($context -match '(?i)(?:USD|dollar)') { return "USD" }
    elseif ($context -match '(?i)(?:GBP|pound)') { return "GBP" }
    return "EUR"
}

# Función para encontrar CVV
function Find-NearbyCVV {
    param([string]$content, [int]$position)
    
    $context = $content.Substring([math]::Max(0, $position - 500), 1000)
    $matches = [regex]::Matches($context, $Patterns.CVV)
    foreach ($match in $matches) {
        return $match.Groups[1].Value
    }
    return "N/A"
}

# Función para extraer datos financieros masiva
function Extract-FinancialData {
    param([string]$content, [int]$blockNum)
    
    $found = @{
        Balances = New-Object System.Collections.ArrayList
        Transactions = New-Object System.Collections.ArrayList
        Accounts = New-Object System.Collections.ArrayList
        CreditCards = New-Object System.Collections.ArrayList
        Users = New-Object System.Collections.ArrayList
    }
    
    Write-Log "TURBO Procesando bloque $blockNum - Tamaño: $($content.Length) caracteres" "TURBO"
    
    # Extraer balances
    $balancePatterns = @($Patterns.Balance, $Patterns.EUR, $Patterns.USD, $Patterns.GBP)
    foreach ($pattern in $balancePatterns) {
        $matches = [regex]::Matches($content, $pattern)
        Write-Log "Encontrados $($matches.Count) matches para patrón balance" "INFO"
        
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
                    Timestamp = Get-Date
                    ScanId = $Global:ScanData.ScanId
                }) | Out-Null
                
                Write-Log "Balance encontrado: $currency $balance" "SUCCESS"
            }
        }
    }
    
    # Extraer cuentas
    $accountPatterns = @($Patterns.Account, $Patterns.IBAN)
    foreach ($pattern in $accountPatterns) {
        $matches = [regex]::Matches($content, $pattern)
        Write-Log "Encontrados $($matches.Count) matches para patrón cuenta" "INFO"
        
        foreach ($match in $matches) {
            $value = $match.Groups[1].Value.Trim()
            if ($value.Length -gt 8) {
                $isValidIBAN = Test-IBAN $value
                $found.Accounts.Add(@{
                    Block = $blockNum
                    AccountNumber = $value
                    IsValidIBAN = $isValidIBAN
                    Position = $match.Index
                    Timestamp = Get-Date
                    ScanId = $Global:ScanData.ScanId
                }) | Out-Null
                
                Write-Log "Cuenta encontrada: $value (IBAN válido: $isValidIBAN)" "SUCCESS"
            }
        }
    }
    
    # Extraer tarjetas de crédito
    $matches = [regex]::Matches($content, $Patterns.CreditCard)
    Write-Log "Encontrados $($matches.Count) matches para tarjetas" "INFO"
    
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
            
            Write-Log "Tarjeta encontrada: $cardNumber (Válida: $isValidCard, CVV: $cvv)" "SUCCESS"
        }
    }
    
    # Extraer usuarios
    $matches = [regex]::Matches($content, $Patterns.User)
    Write-Log "Encontrados $($matches.Count) matches para usuarios" "INFO"
    
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
            
            Write-Log "Usuario encontrado: $value" "SUCCESS"
        }
    }
    
    # Extraer transacciones
    $matches = [regex]::Matches($content, $Patterns.Transaction)
    Write-Log "Encontrados $($matches.Count) matches para transacciones" "INFO"
    
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
            
            Write-Log "Transacción encontrada: $currency $amount" "SUCCESS"
        }
    }
    
    return $found
}

# Función para actualizar métricas
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

# Función para actualizar datos en tiempo real masiva
function Update-RealtimeData {
    param([int]$currentBlock, [int]$totalBlocks)
    
    $currentTime = Get-Date
    $elapsed = $currentTime - $Global:ScanData.StartTime
    $percent = [math]::Round(($currentBlock / $totalBlocks) * 100, 2)
    
    # Crear datos para dashboard masivo
    $dashboardData = @{
        timestamp = $currentTime.ToString("yyyy-MM-dd HH:mm:ss")
        scanId = $Global:ScanData.ScanId
        mode = "MASSIVE_TURBO"
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
        }
        recentData = @{
            balances = $Global:ScanData.Balances | Select-Object -Last 20
            transactions = $Global:ScanData.Transactions | Select-Object -Last 20
            accounts = $Global:ScanData.Accounts | Select-Object -Last 20
            creditCards = $Global:ScanData.CreditCards | Select-Object -Last 20
            users = $Global:ScanData.Users | Select-Object -Last 20
        }
    }
    
    # Guardar archivos locales masivos
    $dashboardData | ConvertTo-Json -Depth 10 | Out-File (Join-Path $OutputDir "massive-dashboard-data.json") -Encoding UTF8
    $dashboardData | ConvertTo-Json -Depth 10 | Out-File (Join-Path $OutputDir "massive-realtime-balances.json") -Encoding UTF8
    
    # Enviar a API
    Send-ToAPI $dashboardData "massive-realtime" | Out-Null
    
    # Mostrar progreso masivo detallado
    Write-Log "=== ACTUALIZACION MASIVA TURBO ===" "TURBO"
    Write-Log "Bloque: $currentBlock de $totalBlocks ($percent%)" "INFO"
    Write-Log "EUR: $($Global:ScanData.TotalEUR.ToString('N2')) | USD: $($Global:ScanData.TotalUSD.ToString('N2')) | GBP: $($Global:ScanData.TotalGBP.ToString('N2'))" "SUCCESS"
    Write-Log "Balances: $($Global:ScanData.Balances.Count) | Transacciones: $($Global:ScanData.Transactions.Count) | Cuentas: $($Global:ScanData.Accounts.Count)" "INFO"
    Write-Log "Tarjetas: $($Global:ScanData.CreditCards.Count) | Usuarios: $($Global:ScanData.Users.Count) | DAES: $($Global:ScanData.DAESData.Count)" "INFO"
    Write-Log "Velocidad: $([math]::Round($Global:PerformanceMetrics.AverageSpeed, 2)) MB/s | Memoria: $([math]::Round($Global:PerformanceMetrics.MemoryUsage, 2)) MB" "INFO"
    Write-Log "Tiempo: $([math]::Round($elapsed.TotalMinutes, 2)) min" "INFO"
}

# Función principal masiva ultra optimizada
function Start-MassiveTurboScan {
    try {
        Write-Log "Iniciando escaneo masivo turbo definitivo" "TURBO"
        
        $fileInfo = Get-Item $FilePath
        $fileSize = $fileInfo.Length
        $totalBlocks = [math]::Ceiling($fileSize / $BlockSize)
        
        Write-Log "Archivo: $([math]::Round($fileSize/1GB, 2)) GB" "INFO"
        Write-Log "Bloques: $totalBlocks" "INFO"
        Write-Log "Tamaño de bloque: $([math]::Round($BlockSize/1MB, 1)) MB" "INFO"
        Write-Log "Modo MASIVO TURBO: Activado" "SUCCESS"
        Write-Log "Scan ID: $($Global:ScanData.ScanId)" "INFO"
        
        $stream = [System.IO.File]::OpenRead($FilePath)
        $reader = New-Object System.IO.StreamReader($stream)
        
        # Procesamiento masivo ultra optimizado
        for ($block = 0; $block -lt $totalBlocks; $block++) {
            $buffer = New-Object char[] $BlockSize
            $bytesRead = $reader.Read($buffer, 0, $BlockSize)
            $content = [string]::new($buffer, 0, $bytesRead)
            
            # Mostrar progreso masivo
            $percent = [math]::Round((($block + 1) / $totalBlocks) * 100, 2)
            Write-Progress -Activity "Escaneo Masivo Turbo DTC1B" -Status "Bloque $($block + 1) de $totalBlocks ($percent%)" -PercentComplete $percent
            
            Write-Log "Procesando bloque $($block + 1) de $totalBlocks" "TURBO"
            
            # Procesar datos masivos
            $daesData = Decode-DAES $content $block
            $financialData = Extract-FinancialData $content $block
            
            # Acumular datos masivos
            if ($financialData.Balances) { $Global:ScanData.Balances.AddRange($financialData.Balances) }
            if ($financialData.Transactions) { $Global:ScanData.Transactions.AddRange($financialData.Transactions) }
            if ($financialData.Accounts) { $Global:ScanData.Accounts.AddRange($financialData.Accounts) }
            if ($financialData.CreditCards) { $Global:ScanData.CreditCards.AddRange($financialData.CreditCards) }
            if ($financialData.Users) { $Global:ScanData.Users.AddRange($financialData.Users) }
            if ($daesData) { $Global:ScanData.DAESData.AddRange($daesData) }
            $Global:ScanData.ProcessedBlocks++
            
            # Actualizar totales masivos
            foreach ($balance in $financialData.Balances) {
                switch ($balance.Currency) {
                    "EUR" { $Global:ScanData.TotalEUR += $balance.Balance }
                    "USD" { $Global:ScanData.TotalUSD += $balance.Balance }
                    "GBP" { $Global:ScanData.TotalGBP += $balance.Balance }
                }
            }
            
            # Actualizar métricas masivas
            $dataExtracted = $financialData.Balances.Count + $financialData.Transactions.Count + $financialData.Accounts.Count + $financialData.CreditCards.Count + $financialData.Users.Count + $daesData.Count
            Update-PerformanceMetrics $bytesRead 1 $dataExtracted
            
            # Actualizar en tiempo real masivo
            if (($block + 1) % $UpdateInterval -eq 0) {
                Update-RealtimeData ($block + 1) $totalBlocks
            }
            
            # Optimización de memoria masiva cada 5 bloques
            if (($block + 1) % 5 -eq 0) {
                [System.GC]::Collect()
                [System.GC]::WaitForPendingFinalizers()
            }
        }
        
        $reader.Close()
        $stream.Close()
        
        Write-Progress -Activity "Escaneo Masivo Turbo DTC1B" -Completed
        
        # Actualización final masiva
        Update-RealtimeData $totalBlocks $totalBlocks
        
        # Mostrar resultados finales masivos
        Write-Log "=== ESCANEO MASIVO TURBO COMPLETADO ===" "SUCCESS"
        Write-Log "Bloques procesados: $($Global:ScanData.ProcessedBlocks)" "SUCCESS"
        Write-Log "Tiempo total: $([math]::Round(((Get-Date) - $Global:ScanData.StartTime).TotalMinutes, 2)) minutos" "SUCCESS"
        
        Write-Log "=== RESULTADOS FINALES MASIVOS ===" "INFO"
        Write-Log "Total EUR: $($Global:ScanData.TotalEUR.ToString('N2'))" "SUCCESS"
        Write-Log "Total USD: $($Global:ScanData.TotalUSD.ToString('N2'))" "SUCCESS"
        Write-Log "Total GBP: $($Global:ScanData.TotalGBP.ToString('N2'))" "SUCCESS"
        
        Write-Log "=== ESTADISTICAS FINALES MASIVAS ===" "INFO"
        Write-Log "Balances encontrados: $($Global:ScanData.Balances.Count)" "INFO"
        Write-Log "Transacciones encontradas: $($Global:ScanData.Transactions.Count)" "INFO"
        Write-Log "Cuentas encontradas: $($Global:ScanData.Accounts.Count)" "INFO"
        Write-Log "Tarjetas encontradas: $($Global:ScanData.CreditCards.Count)" "INFO"
        Write-Log "Usuarios encontrados: $($Global:ScanData.Users.Count)" "INFO"
        Write-Log "Datos DAES decodificados: $($Global:ScanData.DAESData.Count)" "INFO"
        
        # Guardar resultados finales masivos
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
                MassiveMode = $true
                TurboMode = $true
                PerformanceMetrics = $Global:PerformanceMetrics
            }
            FinancialData = @{
                Balances = $Global:ScanData.Balances
                Transactions = $Global:ScanData.Transactions
                Accounts = $Global:ScanData.Accounts
                CreditCards = $Global:ScanData.CreditCards
                Users = $Global:ScanData.Users
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
        
        $finalResults | ConvertTo-Json -Depth 10 | Out-File (Join-Path $OutputDir "massive-turbo-final-results.json") -Encoding UTF8
        
        # Enviar resultados finales a API masiva
        Send-ToAPI $finalResults "massive-final" | Out-Null
        
        Write-Log "Archivos guardados:" "INFO"
        Write-Log "Resultados finales: $OutputDir\massive-turbo-final-results.json" "SUCCESS"
        Write-Log "Datos dashboard: $OutputDir\massive-dashboard-data.json" "SUCCESS"
        Write-Log "Balances tiempo real: $OutputDir\massive-realtime-balances.json" "SUCCESS"
        Write-Log "Log de escaneo: $OutputDir\massive-scan-log.txt" "SUCCESS"
        
        Write-Log "ESCANEO MASIVO TURBO COMPLETADO EXITOSAMENTE" "SUCCESS"
        
    }
    catch {
        Write-Log "Error en escaneo masivo: $($_.Exception.Message)" "ERROR"
        Write-Log "Stack trace: $($_.Exception.StackTrace)" "ERROR"
        $Global:PerformanceMetrics.Errors++
    }
    finally {
        if ($reader) { $reader.Close() }
        if ($stream) { $stream.Close() }
    }
}

# Ejecutar escaneo masivo turbo definitivo
Start-MassiveTurboScan

