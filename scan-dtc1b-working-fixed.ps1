# SCRIPT FUNCIONAL CORREGIDO - EXTRAE DATOS REALES
param(
    [string]$FilePath = "E:\final AAAA\dtc1b",
    [int]$BlockSize = 100MB,
    [string]$OutputDir = "E:\final AAAA\corebanking\extracted-data",
    [int]$UpdateInterval = 5
)

Write-Host "=== SCRIPT FUNCIONAL CORREGIDO ===" -ForegroundColor Green
Write-Host "Archivo: $FilePath" -ForegroundColor Yellow
Write-Host "Tamaño: $([math]::Round((Get-Item $FilePath).Length/1GB, 2)) GB" -ForegroundColor Yellow
Write-Host "Bloque: $([math]::Round($BlockSize/1MB, 1)) MB" -ForegroundColor Yellow
Write-Host "Salida: $OutputDir" -ForegroundColor Yellow

# Crear directorio de salida
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "Directorio creado: $OutputDir" -ForegroundColor Green
}

# Variables globales simples
$Global:ScanResults = @{
    Balances = @()
    Transactions = @()
    Accounts = @()
    CreditCards = @()
    Users = @()
    TotalEUR = 0.0
    TotalUSD = 0.0
    TotalGBP = 0.0
    ProcessedBlocks = 0
    StartTime = Get-Date
    LastUpdate = Get-Date
}

# Patrones de búsqueda mejorados
$SearchPatterns = @{
    # Balances y montos
    Balance = '(?i)(?:balance|saldo|amount|monto|total)[:\s]*([0-9,]+\.?[0-9]*)'
    EUR = '(?i)(?:EUR|euro)[:\s]*([0-9,]+\.?[0-9]*)'
    USD = '(?i)(?:USD|dollar)[:\s]*([0-9,]+\.?[0-9]*)'
    GBP = '(?i)(?:GBP|pound)[:\s]*([0-9,]+\.?[0-9]*)'
    
    # Cuentas bancarias
    Account = '(?i)(?:account|iban|acc|cuenta|account_number)[:\s]*([A-Z0-9\-]{8,})'
    IBAN = '(?i)(?:ES|US|GB|FR|DE)[0-9]{2}[A-Z0-9]{20,}'
    
    # Tarjetas de crédito
    CreditCard = '([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})'
    CVV = '(?i)(?:cvv|cvc|cvv2|security_code)[:\s]*([0-9]{3,4})'
    
    # Usuarios y clientes
    User = '(?i)(?:user|username|email|customer|client)[:\s]*([A-Za-z0-9_\-\.@]+)'
    
    # Transacciones
    Transaction = '(?i)(?:transfer|payment|deposit|withdrawal|transaction)[:\s]*([0-9,]+\.?[0-9]*)'
    
    # Datos adicionales
    Routing = '(?i)(?:routing|aba|bank_code)[:\s]*([0-9]{9})'
    SWIFT = '(?i)(?:SWIFT|BIC)[:\s]*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)'
}

# Función para extraer datos financieros
function Extract-FinancialData {
    param([string]$content, [int]$blockNum)
    
    $found = @{
        Balances = @()
        Transactions = @()
        Accounts = @()
        CreditCards = @()
        Users = @()
    }
    
    Write-Host "Procesando bloque $blockNum - Tamaño: $($content.Length) caracteres" -ForegroundColor Gray
    
    # Extraer balances
    $balancePatterns = @($SearchPatterns.Balance, $SearchPatterns.EUR, $SearchPatterns.USD, $SearchPatterns.GBP)
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
    
    # Extraer cuentas
    $accountPatterns = @($SearchPatterns.Account, $SearchPatterns.IBAN)
    foreach ($pattern in $accountPatterns) {
        $matches = [regex]::Matches($content, $pattern)
        Write-Host "  Encontrados $($matches.Count) matches para patrón cuenta" -ForegroundColor Gray
        
        foreach ($match in $matches) {
            $value = $match.Groups[1].Value.Trim()
            if ($value.Length -gt 8) {
                $found.Accounts += @{
                    Block = $blockNum
                    AccountNumber = $value
                    Position = $match.Index
                    Pattern = $pattern
                    Timestamp = Get-Date
                }
                
                Write-Host "    Cuenta encontrada: $value" -ForegroundColor Green
            }
        }
    }
    
    # Extraer tarjetas de crédito
    $matches = [regex]::Matches($content, $SearchPatterns.CreditCard)
    Write-Host "  Encontrados $($matches.Count) matches para tarjetas" -ForegroundColor Gray
    
    foreach ($match in $matches) {
        $cardNumber = $match.Value.Trim() -replace '[\s\-]', ''
        if ($cardNumber.Length -eq 16) {
            $cvv = Find-NearbyCVV $content $match.Index
            $found.CreditCards += @{
                Block = $blockNum
                CardNumber = $cardNumber
                CVV = $cvv
                Position = $match.Index
                Timestamp = Get-Date
            }
            
            Write-Host "    Tarjeta encontrada: $cardNumber" -ForegroundColor Green
        }
    }
    
    # Extraer usuarios
    $matches = [regex]::Matches($content, $SearchPatterns.User)
    Write-Host "  Encontrados $($matches.Count) matches para usuarios" -ForegroundColor Gray
    
    foreach ($match in $matches) {
        $value = $match.Groups[1].Value.Trim()
        if ($value.Length -gt 2 -and $value -match '@') {
            $found.Users += @{
                Block = $blockNum
                Username = $value
                Position = $match.Index
                Timestamp = Get-Date
            }
            
            Write-Host "    Usuario encontrado: $value" -ForegroundColor Green
        }
    }
    
    # Extraer transacciones
    $matches = [regex]::Matches($content, $SearchPatterns.Transaction)
    Write-Host "  Encontrados $($matches.Count) matches para transacciones" -ForegroundColor Gray
    
    foreach ($match in $matches) {
        $value = $match.Groups[1].Value.Trim()
        if ($value -match '^[0-9,]+\.?[0-9]*$' -and $value.Length -gt 0) {
            $amount = [double]($value -replace ',', '')
            $currency = Detect-Currency $content $match.Index
            $found.Transactions += @{
                Block = $blockNum
                Amount = $amount
                Currency = $currency
                Position = $match.Index
                RawValue = $value
                Timestamp = Get-Date
            }
            
            Write-Host "    Transacción encontrada: $currency $amount" -ForegroundColor Green
        }
    }
    
    return $found
}

# Función para detectar moneda
function Detect-Currency {
    param([string]$content, [int]$position)
    
    $context = $content.Substring([math]::Max(0, $position - 100), 200)
    if ($context -match '(?i)(?:EUR|euro)') { return "EUR" }
    elseif ($context -match '(?i)(?:USD|dollar)') { return "USD" }
    elseif ($context -match '(?i)(?:GBP|pound)') { return "GBP" }
    return "EUR"
}

# Función para encontrar CVV
function Find-NearbyCVV {
    param([string]$content, [int]$position)
    
    $context = $content.Substring([math]::Max(0, $position - 300), 600)
    $matches = [regex]::Matches($context, $SearchPatterns.CVV)
    foreach ($match in $matches) {
        return $match.Groups[1].Value
    }
    return "N/A"
}

# Función para actualizar datos en tiempo real
function Update-RealtimeData {
    param([int]$currentBlock, [int]$totalBlocks)
    
    $currentTime = Get-Date
    $elapsed = $currentTime - $Global:ScanResults.StartTime
    $percent = [math]::Round(($currentBlock / $totalBlocks) * 100, 2)
    
    # Crear datos para dashboard
    $dashboardData = @{
        timestamp = $currentTime.ToString("yyyy-MM-dd HH:mm:ss")
        progress = @{
            currentBlock = $currentBlock
            totalBlocks = $totalBlocks
            percentage = $percent
            elapsedMinutes = [math]::Round($elapsed.TotalMinutes, 2)
            estimatedRemaining = if ($currentBlock -gt 0) { [math]::Round(($elapsed.TotalMinutes / $currentBlock) * ($totalBlocks - $currentBlock), 2) } else { 0 }
        }
        balances = @{
            EUR = $Global:ScanResults.TotalEUR
            USD = $Global:ScanResults.TotalUSD
            GBP = $Global:ScanResults.TotalGBP
        }
        statistics = @{
            balancesFound = $Global:ScanResults.Balances.Count
            transactionsFound = $Global:ScanResults.Transactions.Count
            accountsFound = $Global:ScanResults.Accounts.Count
            creditCardsFound = $Global:ScanResults.CreditCards.Count
            usersFound = $Global:ScanResults.Users.Count
        }
        recentData = @{
            balances = $Global:ScanResults.Balances | Select-Object -Last 10
            transactions = $Global:ScanResults.Transactions | Select-Object -Last 10
            accounts = $Global:ScanResults.Accounts | Select-Object -Last 10
            creditCards = $Global:ScanResults.CreditCards | Select-Object -Last 10
            users = $Global:ScanResults.Users | Select-Object -Last 10
        }
    }
    
    # Guardar archivos
    $dashboardData | ConvertTo-Json -Depth 10 | Out-File (Join-Path $OutputDir "dashboard-data.json") -Encoding UTF8
    $dashboardData | ConvertTo-Json -Depth 10 | Out-File (Join-Path $OutputDir "realtime-balances.json") -Encoding UTF8
    
    # Mostrar progreso detallado
    Write-Host "`n=== ACTUALIZACION TIEMPO REAL ===" -ForegroundColor Cyan
    Write-Host "Bloque: $currentBlock de $totalBlocks ($percent%)" -ForegroundColor White
    Write-Host "EUR: $($Global:ScanResults.TotalEUR.ToString('N2')) | USD: $($Global:ScanResults.TotalUSD.ToString('N2')) | GBP: $($Global:ScanResults.TotalGBP.ToString('N2'))" -ForegroundColor Green
    Write-Host "Balances: $($Global:ScanResults.Balances.Count) | Transacciones: $($Global:ScanResults.Transactions.Count) | Cuentas: $($Global:ScanResults.Accounts.Count)" -ForegroundColor Yellow
    Write-Host "Tarjetas: $($Global:ScanResults.CreditCards.Count) | Usuarios: $($Global:ScanResults.Users.Count)" -ForegroundColor Yellow
    Write-Host "Tiempo: $([math]::Round($elapsed.TotalMinutes, 2)) min" -ForegroundColor White
    
    $Global:ScanResults.LastUpdate = $currentTime
}

# Función principal
function Start-WorkingScan {
    try {
        Write-Host "`n=== INICIANDO ESCANEO FUNCIONAL ===" -ForegroundColor Green
        
        $fileInfo = Get-Item $FilePath
        $fileSize = $fileInfo.Length
        $totalBlocks = [math]::Ceiling($fileSize / $BlockSize)
        
        Write-Host "Archivo: $([math]::Round($fileSize/1GB, 2)) GB" -ForegroundColor Green
        Write-Host "Bloques: $totalBlocks" -ForegroundColor Green
        Write-Host "Tamaño de bloque: $([math]::Round($BlockSize/1MB, 1)) MB" -ForegroundColor Green
        
        $stream = [System.IO.File]::OpenRead($FilePath)
        $reader = New-Object System.IO.StreamReader($stream)
        
        # Procesamiento bloque por bloque
        for ($block = 0; $block -lt $totalBlocks; $block++) {
            $buffer = New-Object char[] $BlockSize
            $bytesRead = $reader.Read($buffer, 0, $BlockSize)
            $content = [string]::new($buffer, 0, $bytesRead)
            
            # Mostrar progreso
            $percent = [math]::Round((($block + 1) / $totalBlocks) * 100, 2)
            Write-Progress -Activity "Escaneo Funcional DTC1B" -Status "Bloque $($block + 1) de $totalBlocks ($percent%)" -PercentComplete $percent
            
            Write-Host "`nProcesando bloque $($block + 1) de $totalBlocks" -ForegroundColor Cyan
            
            # Extraer datos
            $found = Extract-FinancialData $content $block
            
            # Acumular datos
            $Global:ScanResults.Balances += $found.Balances
            $Global:ScanResults.Transactions += $found.Transactions
            $Global:ScanResults.Accounts += $found.Accounts
            $Global:ScanResults.CreditCards += $found.CreditCards
            $Global:ScanResults.Users += $found.Users
            $Global:ScanResults.ProcessedBlocks++
            
            # Actualizar totales
            foreach ($balance in $found.Balances) {
                switch ($balance.Currency) {
                    "EUR" { $Global:ScanResults.TotalEUR += $balance.Balance }
                    "USD" { $Global:ScanResults.TotalUSD += $balance.Balance }
                    "GBP" { $Global:ScanResults.TotalGBP += $balance.Balance }
                }
            }
            
            # Actualizar en tiempo real
            if (($block + 1) % $UpdateInterval -eq 0) {
                Update-RealtimeData ($block + 1) $totalBlocks
            }
            
            # Limpiar memoria cada 20 bloques
            if (($block + 1) % 20 -eq 0) {
                [System.GC]::Collect()
                [System.GC]::WaitForPendingFinalizers()
            }
        }
        
        $reader.Close()
        $stream.Close()
        
        Write-Progress -Activity "Escaneo Funcional DTC1B" -Completed
        
        # Actualización final
        Update-RealtimeData $totalBlocks $totalBlocks
        
        # Mostrar resultados finales
        Write-Host "`n=== ESCANEO FUNCIONAL COMPLETADO ===" -ForegroundColor Green
        Write-Host "Bloques procesados: $($Global:ScanResults.ProcessedBlocks)" -ForegroundColor Green
        Write-Host "Tiempo total: $([math]::Round(((Get-Date) - $Global:ScanResults.StartTime).TotalMinutes, 2)) minutos" -ForegroundColor Green
        
        Write-Host "`n=== RESULTADOS FINALES ===" -ForegroundColor Cyan
        Write-Host "Total EUR: $($Global:ScanResults.TotalEUR.ToString('N2'))" -ForegroundColor Green
        Write-Host "Total USD: $($Global:ScanResults.TotalUSD.ToString('N2'))" -ForegroundColor Green
        Write-Host "Total GBP: $($Global:ScanResults.TotalGBP.ToString('N2'))" -ForegroundColor Green
        
        Write-Host "`n=== ESTADISTICAS FINALES ===" -ForegroundColor Yellow
        Write-Host "Balances encontrados: $($Global:ScanResults.Balances.Count)" -ForegroundColor White
        Write-Host "Transacciones encontradas: $($Global:ScanResults.Transactions.Count)" -ForegroundColor White
        Write-Host "Cuentas encontradas: $($Global:ScanResults.Accounts.Count)" -ForegroundColor White
        Write-Host "Tarjetas encontradas: $($Global:ScanResults.CreditCards.Count)" -ForegroundColor White
        Write-Host "Usuarios encontrados: $($Global:ScanResults.Users.Count)" -ForegroundColor White
        
        # Guardar resultados finales
        $finalResults = @{
            ScanInfo = @{
                FilePath = $FilePath
                FileSize = $fileSize
                TotalBlocks = $totalBlocks
                BlockSize = $BlockSize
                ProcessedBlocks = $Global:ScanResults.ProcessedBlocks
                StartTime = $Global:ScanResults.StartTime
                EndTime = Get-Date
                TotalTime = ((Get-Date) - $Global:ScanResults.StartTime).TotalMinutes
            }
            FinancialData = @{
                Balances = $Global:ScanResults.Balances
                Transactions = $Global:ScanResults.Transactions
                Accounts = $Global:ScanResults.Accounts
                CreditCards = $Global:ScanResults.CreditCards
                Users = $Global:ScanResults.Users
            }
            Totals = @{
                EUR = $Global:ScanResults.TotalEUR
                USD = $Global:ScanResults.TotalUSD
                GBP = $Global:ScanResults.TotalGBP
            }
        }
        
        $finalResults | ConvertTo-Json -Depth 10 | Out-File (Join-Path $OutputDir "working-results.json") -Encoding UTF8
        
        Write-Host "`nArchivos guardados:" -ForegroundColor Cyan
        Write-Host "Resultados finales: $OutputDir\working-results.json" -ForegroundColor Green
        Write-Host "Datos dashboard: $OutputDir\dashboard-data.json" -ForegroundColor Green
        Write-Host "Balances tiempo real: $OutputDir\realtime-balances.json" -ForegroundColor Green
        
        Write-Host "`nESCANEO FUNCIONAL COMPLETADO EXITOSAMENTE" -ForegroundColor Green
        
    }
    catch {
        Write-Host "Error en escaneo: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Stack trace: $($_.Exception.StackTrace)" -ForegroundColor Red
    }
    finally {
        if ($reader) { $reader.Close() }
        if ($stream) { $stream.Close() }
    }
}

# Ejecutar escaneo funcional
Start-WorkingScan
