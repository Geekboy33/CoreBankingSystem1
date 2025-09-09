# SCRIPT FINAL OPTIMIZADO DTC1B - TODAS LAS FUNCIONALIDADES
param(
    [string]$FilePath = "E:\final AAAA\dtc1b",
    [int]$BlockSize = 25MB,
    [string]$OutputDir = "E:\final AAAA\corebanking\extracted-data",
    [int]$UpdateInterval = 5
)

Write-Host "=== SCRIPT FINAL OPTIMIZADO DTC1B ===" -ForegroundColor Cyan
Write-Host "Archivo: $FilePath" -ForegroundColor Yellow
Write-Host "Bloque: $([math]::Round($BlockSize/1MB, 1)) MB" -ForegroundColor Yellow
Write-Host "Salida: $OutputDir" -ForegroundColor Yellow
Write-Host "Actualización: cada $UpdateInterval bloques" -ForegroundColor Yellow

# Crear directorio de salida
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "Directorio creado: $OutputDir" -ForegroundColor Green
}

# Variables globales
$Global:ScanData = @{
    Balances = @()
    Transactions = @()
    Accounts = @()
    CreditCards = @()
    Users = @()
    DAESData = @()
    TotalEUR = 0.0
    TotalUSD = 0.0
    TotalGBP = 0.0
    ProcessedBlocks = 0
    StartTime = Get-Date
}

# Patrones optimizados
$Patterns = @{
    Balance = @(
        '(?i)(?:balance|saldo|amount|monto)[:\s]*([0-9,]+\.?[0-9]*)',
        '(?i)(?:EUR|euro)[:\s]*([0-9,]+\.?[0-9]*)',
        '(?i)(?:USD|dollar)[:\s]*([0-9,]+\.?[0-9]*)',
        '(?i)(?:GBP|pound)[:\s]*([0-9,]+\.?[0-9]*)'
    )
    Account = @(
        '(?i)(?:account|iban|acc|cuenta)[:\s]*([A-Z0-9\-]{8,})',
        '(?i)(?:ES|US|GB)[0-9]{2}[A-Z0-9]{20,}'
    )
    CreditCard = @(
        '(?:[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})',
        '(?i)(?:card|credit)[:\s]*([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})'
    )
    CVV = @(
        '(?i)(?:cvv|cvc|cvv2)[:\s]*([0-9]{3,4})'
    )
    User = @(
        '(?i)(?:user|username|email|customer)[:\s]*([A-Za-z0-9_\-\.@]+)'
    )
    DAES = @(
        '(?i)(?:DAES|AES|encrypted|cipher)[:\s]*([A-Za-z0-9+/=]{20,})'
    )
}

# Función para decodificar DAES
function Decode-DAES {
    param([string]$content, [int]$blockNum)
    
    $daesResults = @()
    foreach ($pattern in $Patterns.DAES) {
        $matches = [regex]::Matches($content, $pattern)
        foreach ($match in $matches) {
            $encrypted = $match.Groups[1].Value.Trim()
            try {
                $decoded = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($encrypted))
                $daesResults += @{
                    Type = "DAES"
                    Original = $encrypted
                    Decoded = $decoded
                    Block = $blockNum
                    Position = $match.Index
                }
            }
            catch {
                $daesResults += @{
                    Type = "DAES_TEXT"
                    Original = $encrypted
                    Decoded = $encrypted
                    Block = $blockNum
                    Position = $match.Index
                }
            }
        }
    }
    return $daesResults
}

# Función para extraer datos financieros
function Extract-FinancialData {
    param([string]$content, [int]$blockNum)
    
    $results = @{
        Balances = @()
        Transactions = @()
        Accounts = @()
        CreditCards = @()
        Users = @()
    }
    
    # Procesar balances
    foreach ($pattern in $Patterns.Balance) {
        $matches = [regex]::Matches($content, $pattern)
        foreach ($match in $matches) {
            $value = $match.Groups[1].Value.Trim()
            if ($value -match '^[0-9,]+\.?[0-9]*$') {
                $balance = [double]($value -replace ',', '')
                $currency = Detect-Currency $content $match.Index
                
                $results.Balances += @{
                    Block = $blockNum
                    Balance = $balance
                    Currency = $currency
                    Position = $match.Index
                    RawValue = $value
                    Timestamp = Get-Date
                }
                
                # Actualizar totales globales
                switch ($currency) {
                    "EUR" { $Global:ScanData.TotalEUR += $balance }
                    "USD" { $Global:ScanData.TotalUSD += $balance }
                    "GBP" { $Global:ScanData.TotalGBP += $balance }
                }
            }
        }
    }
    
    # Procesar cuentas
    foreach ($pattern in $Patterns.Account) {
        $matches = [regex]::Matches($content, $pattern)
        foreach ($match in $matches) {
            $value = $match.Groups[1].Value.Trim()
            if ($value.Length -gt 8) {
                $results.Accounts += @{
                    Block = $blockNum
                    AccountNumber = $value
                    Position = $match.Index
                    Timestamp = Get-Date
                }
            }
        }
    }
    
    # Procesar tarjetas de crédito
    foreach ($pattern in $Patterns.CreditCard) {
        $matches = [regex]::Matches($content, $pattern)
        foreach ($match in $matches) {
            $cardNumber = $match.Groups[1].Value.Trim() -replace '[\s\-]', ''
            if ($cardNumber.Length -eq 16) {
                $cvv = Find-NearbyCVV $content $match.Index
                $results.CreditCards += @{
                    Block = $blockNum
                    CardNumber = $cardNumber
                    CVV = $cvv
                    Position = $match.Index
                    Timestamp = Get-Date
                }
            }
        }
    }
    
    # Procesar usuarios
    foreach ($pattern in $Patterns.User) {
        $matches = [regex]::Matches($content, $pattern)
        foreach ($match in $matches) {
            $value = $match.Groups[1].Value.Trim()
            if ($value.Length -gt 2) {
                $results.Users += @{
                    Block = $blockNum
                    Username = $value
                    Position = $match.Index
                    Timestamp = Get-Date
                }
            }
        }
    }
    
    return $results
}

# Función para detectar moneda
function Detect-Currency {
    param([string]$content, [int]$position)
    
    $context = $content.Substring([math]::Max(0, $position - 50), 100)
    if ($context -match '(?i)(?:EUR|euro)') { return "EUR" }
    elseif ($context -match '(?i)(?:USD|dollar)') { return "USD" }
    elseif ($context -match '(?i)(?:GBP|pound)') { return "GBP" }
    return "EUR"
}

# Función para encontrar CVV
function Find-NearbyCVV {
    param([string]$content, [int]$position)
    
    $context = $content.Substring([math]::Max(0, $position - 200), 400)
    foreach ($pattern in $Patterns.CVV) {
        $matches = [regex]::Matches($context, $pattern)
        foreach ($match in $matches) {
            return $match.Groups[1].Value
        }
    }
    return "N/A"
}

# Función para actualizar datos en tiempo real
function Update-RealtimeData {
    param([int]$currentBlock, [int]$totalBlocks)
    
    $currentTime = Get-Date
    $elapsed = $currentTime - $Global:ScanData.StartTime
    $percent = [math]::Round(($currentBlock / $totalBlocks) * 100, 2)
    
    # Crear datos para dashboard
    $dashboardData = @{
        timestamp = $currentTime.ToString("yyyy-MM-dd HH:mm:ss")
        progress = @{
            currentBlock = $currentBlock
            totalBlocks = $totalBlocks
            percentage = $percent
            elapsedMinutes = [math]::Round($elapsed.TotalMinutes, 2)
        }
        balances = @{
            EUR = $Global:ScanData.TotalEUR
            USD = $Global:ScanData.TotalUSD
            GBP = $Global:ScanData.TotalGBP
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
            balances = $Global:ScanData.Balances | Select-Object -Last 10
            transactions = $Global:ScanData.Transactions | Select-Object -Last 10
            accounts = $Global:ScanData.Accounts | Select-Object -Last 10
            creditCards = $Global:ScanData.CreditCards | Select-Object -Last 10
            users = $Global:ScanData.Users | Select-Object -Last 10
        }
    }
    
    # Guardar archivos
    $dashboardData | ConvertTo-Json -Depth 10 | Out-File (Join-Path $OutputDir "dashboard-data.json") -Encoding UTF8
    $dashboardData | ConvertTo-Json -Depth 10 | Out-File (Join-Path $OutputDir "realtime-balances.json") -Encoding UTF8
    
    # Mostrar progreso
    Write-Host "`nACTUALIZACION TIEMPO REAL - Bloque $currentBlock de $totalBlocks ($percent%)" -ForegroundColor Cyan
    Write-Host "EUR: $($Global:ScanData.TotalEUR.ToString('N2')) | USD: $($Global:ScanData.TotalUSD.ToString('N2')) | GBP: $($Global:ScanData.TotalGBP.ToString('N2'))" -ForegroundColor Green
    Write-Host "Balances: $($Global:ScanData.Balances.Count) | Transacciones: $($Global:ScanData.Transactions.Count) | Cuentas: $($Global:ScanData.Accounts.Count)" -ForegroundColor Yellow
    Write-Host "Tarjetas: $($Global:ScanData.CreditCards.Count) | Usuarios: $($Global:ScanData.Users.Count) | DAES: $($Global:ScanData.DAESData.Count)" -ForegroundColor Yellow
    Write-Host "Tiempo: $([math]::Round($elapsed.TotalMinutes, 2)) min" -ForegroundColor White
}

# Función principal de escaneo
function Start-UltimateScan {
    try {
        $fileInfo = Get-Item $FilePath
        $fileSize = $fileInfo.Length
        $totalBlocks = [math]::Ceiling($fileSize / $BlockSize)
        
        Write-Host "`n=== INICIANDO ESCANEO ULTIMATE ===" -ForegroundColor Cyan
        Write-Host "Archivo: $([math]::Round($fileSize/1GB, 2)) GB" -ForegroundColor Green
        Write-Host "Bloques: $totalBlocks" -ForegroundColor Green
        
        $stream = [System.IO.File]::OpenRead($FilePath)
        $reader = New-Object System.IO.StreamReader($stream)
        
        for ($block = 0; $block -lt $totalBlocks; $block++) {
            $buffer = New-Object char[] $BlockSize
            $bytesRead = $reader.Read($buffer, 0, $BlockSize)
            $content = [string]::new($buffer, 0, $bytesRead)
            
            # Mostrar progreso
            $percent = [math]::Round((($block + 1) / $totalBlocks) * 100, 2)
            Write-Progress -Activity "Escaneo Ultimate DTC1B" -Status "Bloque $($block + 1) de $totalBlocks ($percent%)" -PercentComplete $percent
            
            # Procesar datos
            $daesData = Decode-DAES $content $block
            $financialData = Extract-FinancialData $content $block
            
            # Acumular datos
            $Global:ScanData.Balances += $financialData.Balances
            $Global:ScanData.Transactions += $financialData.Transactions
            $Global:ScanData.Accounts += $financialData.Accounts
            $Global:ScanData.CreditCards += $financialData.CreditCards
            $Global:ScanData.Users += $financialData.Users
            $Global:ScanData.DAESData += $daesData
            $Global:ScanData.ProcessedBlocks++
            
            # Actualizar en tiempo real
            if (($block + 1) % $UpdateInterval -eq 0) {
                Update-RealtimeData ($block + 1) $totalBlocks
            }
            
            # Optimización de memoria
            if (($block + 1) % 100 -eq 0) {
                [System.GC]::Collect()
            }
        }
        
        $reader.Close()
        $stream.Close()
        
        Write-Progress -Activity "Escaneo Ultimate DTC1B" -Completed
        
        # Actualización final
        Update-RealtimeData $totalBlocks $totalBlocks
        
        # Mostrar resultados finales
        Write-Host "`n=== ESCANEO ULTIMATE COMPLETADO ===" -ForegroundColor Green
        Write-Host "Bloques procesados: $($Global:ScanData.ProcessedBlocks)" -ForegroundColor Green
        Write-Host "Tiempo total: $([math]::Round(((Get-Date) - $Global:ScanData.StartTime).TotalMinutes, 2)) minutos" -ForegroundColor Green
        
        Write-Host "`n=== RESULTADOS FINALES ===" -ForegroundColor Cyan
        Write-Host "Total EUR: $($Global:ScanData.TotalEUR.ToString('N2'))" -ForegroundColor Green
        Write-Host "Total USD: $($Global:ScanData.TotalUSD.ToString('N2'))" -ForegroundColor Green
        Write-Host "Total GBP: $($Global:ScanData.TotalGBP.ToString('N2'))" -ForegroundColor Green
        
        Write-Host "`n=== ESTADISTICAS FINALES ===" -ForegroundColor Yellow
        Write-Host "Balances encontrados: $($Global:ScanData.Balances.Count)" -ForegroundColor White
        Write-Host "Transacciones encontradas: $($Global:ScanData.Transactions.Count)" -ForegroundColor White
        Write-Host "Cuentas encontradas: $($Global:ScanData.Accounts.Count)" -ForegroundColor White
        Write-Host "Tarjetas encontradas: $($Global:ScanData.CreditCards.Count)" -ForegroundColor White
        Write-Host "Usuarios encontrados: $($Global:ScanData.Users.Count)" -ForegroundColor White
        Write-Host "Datos DAES decodificados: $($Global:ScanData.DAESData.Count)" -ForegroundColor White
        
        # Guardar resultados finales
        $finalResults = @{
            ScanInfo = @{
                FilePath = $FilePath
                FileSize = $fileSize
                TotalBlocks = $totalBlocks
                BlockSize = $BlockSize
                ProcessedBlocks = $Global:ScanData.ProcessedBlocks
                StartTime = $Global:ScanData.StartTime
                EndTime = Get-Date
                TotalTime = ((Get-Date) - $Global:ScanData.StartTime).TotalMinutes
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
        
        $finalResults | ConvertTo-Json -Depth 10 | Out-File (Join-Path $OutputDir "final-results.json") -Encoding UTF8
        
        Write-Host "`nArchivos guardados:" -ForegroundColor Cyan
        Write-Host "Resultados finales: $OutputDir\final-results.json" -ForegroundColor Green
        Write-Host "Datos dashboard: $OutputDir\dashboard-data.json" -ForegroundColor Green
        Write-Host "Balances tiempo real: $OutputDir\realtime-balances.json" -ForegroundColor Green
        
        Write-Host "`nESCANEO ULTIMATE COMPLETADO EXITOSAMENTE" -ForegroundColor Green
        
    }
    catch {
        Write-Host "Error en escaneo: $($_.Exception.Message)" -ForegroundColor Red
    }
    finally {
        if ($reader) { $reader.Close() }
        if ($stream) { $stream.Close() }
    }
}

# Ejecutar escaneo ultimate
Start-UltimateScan
