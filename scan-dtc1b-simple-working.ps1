# SCRIPT SIMPLE Y FUNCIONAL - EXTRAE DATOS REALES
param(
    [string]$FilePath = "E:\final AAAA\dtc1b",
    [int]$BlockSize = 50MB,
    [string]$OutputDir = "E:\final AAAA\corebanking\extracted-data"
)

Write-Host "=== SCRIPT SIMPLE Y FUNCIONAL ===" -ForegroundColor Green
Write-Host "Archivo: $FilePath" -ForegroundColor Yellow
Write-Host "Bloque: $([math]::Round($BlockSize/1MB, 1)) MB" -ForegroundColor Yellow
Write-Host "Salida: $OutputDir" -ForegroundColor Yellow

# Crear directorio de salida
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "Directorio creado: $OutputDir" -ForegroundColor Green
}

# Variables simples
$Global:Results = @{
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
}

# Patrones simples y efectivos
$Patterns = @{
    Balance = '(?i)(?:balance|saldo|amount|monto)[:\s]*([0-9,]+\.?[0-9]*)'
    EUR = '(?i)(?:EUR|euro)[:\s]*([0-9,]+\.?[0-9]*)'
    USD = '(?i)(?:USD|dollar)[:\s]*([0-9,]+\.?[0-9]*)'
    GBP = '(?i)(?:GBP|pound)[:\s]*([0-9,]+\.?[0-9]*)'
    Account = '(?i)(?:account|iban|acc|cuenta)[:\s]*([A-Z0-9\-]{8,})'
    CreditCard = '([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})'
    CVV = '(?i)(?:cvv|cvc|cvv2)[:\s]*([0-9]{3,4})'
    User = '(?i)(?:user|username|email|customer)[:\s]*([A-Za-z0-9_\-\.@]+)'
    Transaction = '(?i)(?:transfer|payment|deposit|withdrawal)[:\s]*([0-9,]+\.?[0-9]*)'
}

# Función simple para extraer datos
function Extract-Data {
    param([string]$content, [int]$blockNum)
    
    $found = @{
        Balances = @()
        Transactions = @()
        Accounts = @()
        CreditCards = @()
        Users = @()
    }
    
    # Buscar balances
    $balanceMatches = [regex]::Matches($content, $Patterns.Balance)
    foreach ($match in $balanceMatches) {
        $value = $match.Groups[1].Value.Trim()
        if ($value -match '^[0-9,]+\.?[0-9]*$') {
            $balance = [double]($value -replace ',', '')
            $found.Balances += @{
                Block = $blockNum
                Balance = $balance
                Currency = "EUR"
                Position = $match.Index
                RawValue = $value
            }
        }
    }
    
    # Buscar EUR específico
    $eurMatches = [regex]::Matches($content, $Patterns.EUR)
    foreach ($match in $eurMatches) {
        $value = $match.Groups[1].Value.Trim()
        if ($value -match '^[0-9,]+\.?[0-9]*$') {
            $balance = [double]($value -replace ',', '')
            $found.Balances += @{
                Block = $blockNum
                Balance = $balance
                Currency = "EUR"
                Position = $match.Index
                RawValue = $value
            }
        }
    }
    
    # Buscar USD específico
    $usdMatches = [regex]::Matches($content, $Patterns.USD)
    foreach ($match in $usdMatches) {
        $value = $match.Groups[1].Value.Trim()
        if ($value -match '^[0-9,]+\.?[0-9]*$') {
            $balance = [double]($value -replace ',', '')
            $found.Balances += @{
                Block = $blockNum
                Balance = $balance
                Currency = "USD"
                Position = $match.Index
                RawValue = $value
            }
        }
    }
    
    # Buscar GBP específico
    $gbpMatches = [regex]::Matches($content, $Patterns.GBP)
    foreach ($match in $gbpMatches) {
        $value = $match.Groups[1].Value.Trim()
        if ($value -match '^[0-9,]+\.?[0-9]*$') {
            $balance = [double]($value -replace ',', '')
            $found.Balances += @{
                Block = $blockNum
                Balance = $balance
                Currency = "GBP"
                Position = $match.Index
                RawValue = $value
            }
        }
    }
    
    # Buscar cuentas
    $accountMatches = [regex]::Matches($content, $Patterns.Account)
    foreach ($match in $accountMatches) {
        $value = $match.Groups[1].Value.Trim()
        if ($value.Length -gt 8) {
            $found.Accounts += @{
                Block = $blockNum
                AccountNumber = $value
                Position = $match.Index
            }
        }
    }
    
    # Buscar tarjetas de crédito
    $cardMatches = [regex]::Matches($content, $Patterns.CreditCard)
    foreach ($match in $cardMatches) {
        $cardNumber = $match.Value.Trim() -replace '[\s\-]', ''
        if ($cardNumber.Length -eq 16) {
            $found.CreditCards += @{
                Block = $blockNum
                CardNumber = $cardNumber
                Position = $match.Index
            }
        }
    }
    
    # Buscar usuarios
    $userMatches = [regex]::Matches($content, $Patterns.User)
    foreach ($match in $userMatches) {
        $value = $match.Groups[1].Value.Trim()
        if ($value.Length -gt 2) {
            $found.Users += @{
                Block = $blockNum
                Username = $value
                Position = $match.Index
            }
        }
    }
    
    # Buscar transacciones
    $transactionMatches = [regex]::Matches($content, $Patterns.Transaction)
    foreach ($match in $transactionMatches) {
        $value = $match.Groups[1].Value.Trim()
        if ($value -match '^[0-9,]+\.?[0-9]*$') {
            $amount = [double]($value -replace ',', '')
            $found.Transactions += @{
                Block = $blockNum
                Amount = $amount
                Currency = "EUR"
                Position = $match.Index
            }
        }
    }
    
    return $found
}

# Función para mostrar progreso
function Show-Progress {
    param([int]$currentBlock, [int]$totalBlocks)
    
    $percent = [math]::Round(($currentBlock / $totalBlocks) * 100, 2)
    $elapsed = (Get-Date) - $Global:Results.StartTime
    
    Write-Host "`nProgreso: $currentBlock de $totalBlocks ($percent%)" -ForegroundColor Cyan
    Write-Host "EUR: $($Global:Results.TotalEUR.ToString('N2')) | USD: $($Global:Results.TotalUSD.ToString('N2')) | GBP: $($Global:Results.TotalGBP.ToString('N2'))" -ForegroundColor Green
    Write-Host "Balances: $($Global:Results.Balances.Count) | Transacciones: $($Global:Results.Transactions.Count) | Cuentas: $($Global:Results.Accounts.Count)" -ForegroundColor Yellow
    Write-Host "Tarjetas: $($Global:Results.CreditCards.Count) | Usuarios: $($Global:Results.Users.Count)" -ForegroundColor Yellow
    Write-Host "Tiempo: $([math]::Round($elapsed.TotalMinutes, 2)) min" -ForegroundColor White
}

# Función principal simple
function Start-SimpleScan {
    try {
        Write-Host "`n=== INICIANDO ESCANEO SIMPLE ===" -ForegroundColor Green
        
        $fileInfo = Get-Item $FilePath
        $fileSize = $fileInfo.Length
        $totalBlocks = [math]::Ceiling($fileSize / $BlockSize)
        
        Write-Host "Archivo: $([math]::Round($fileSize/1GB, 2)) GB" -ForegroundColor Green
        Write-Host "Bloques: $totalBlocks" -ForegroundColor Green
        
        $stream = [System.IO.File]::OpenRead($FilePath)
        $reader = New-Object System.IO.StreamReader($stream)
        
        # Procesamiento simple
        for ($block = 0; $block -lt $totalBlocks; $block++) {
            $buffer = New-Object char[] $BlockSize
            $bytesRead = $reader.Read($buffer, 0, $BlockSize)
            $content = [string]::new($buffer, 0, $bytesRead)
            
            # Mostrar progreso
            $percent = [math]::Round((($block + 1) / $totalBlocks) * 100, 2)
            Write-Progress -Activity "Escaneo Simple DTC1B" -Status "Bloque $($block + 1) de $totalBlocks ($percent%)" -PercentComplete $percent
            
            # Extraer datos
            $found = Extract-Data $content $block
            
            # Acumular datos
            $Global:Results.Balances += $found.Balances
            $Global:Results.Transactions += $found.Transactions
            $Global:Results.Accounts += $found.Accounts
            $Global:Results.CreditCards += $found.CreditCards
            $Global:Results.Users += $found.Users
            $Global:Results.ProcessedBlocks++
            
            # Actualizar totales
            foreach ($balance in $found.Balances) {
                switch ($balance.Currency) {
                    "EUR" { $Global:Results.TotalEUR += $balance.Balance }
                    "USD" { $Global:Results.TotalUSD += $balance.Balance }
                    "GBP" { $Global:Results.TotalGBP += $balance.Balance }
                }
            }
            
            # Mostrar progreso cada 10 bloques
            if (($block + 1) % 10 -eq 0) {
                Show-Progress ($block + 1) $totalBlocks
            }
            
            # Limpiar memoria cada 50 bloques
            if (($block + 1) % 50 -eq 0) {
                [System.GC]::Collect()
            }
        }
        
        $reader.Close()
        $stream.Close()
        
        Write-Progress -Activity "Escaneo Simple DTC1B" -Completed
        
        # Mostrar resultados finales
        Write-Host "`n=== ESCANEO SIMPLE COMPLETADO ===" -ForegroundColor Green
        Write-Host "Bloques procesados: $($Global:Results.ProcessedBlocks)" -ForegroundColor Green
        Write-Host "Tiempo total: $([math]::Round(((Get-Date) - $Global:Results.StartTime).TotalMinutes, 2)) minutos" -ForegroundColor Green
        
        Write-Host "`n=== RESULTADOS FINALES ===" -ForegroundColor Cyan
        Write-Host "Total EUR: $($Global:Results.TotalEUR.ToString('N2'))" -ForegroundColor Green
        Write-Host "Total USD: $($Global:Results.TotalUSD.ToString('N2'))" -ForegroundColor Green
        Write-Host "Total GBP: $($Global:Results.TotalGBP.ToString('N2'))" -ForegroundColor Green
        
        Write-Host "`n=== ESTADISTICAS FINALES ===" -ForegroundColor Yellow
        Write-Host "Balances encontrados: $($Global:Results.Balances.Count)" -ForegroundColor White
        Write-Host "Transacciones encontradas: $($Global:Results.Transactions.Count)" -ForegroundColor White
        Write-Host "Cuentas encontradas: $($Global:Results.Accounts.Count)" -ForegroundColor White
        Write-Host "Tarjetas encontradas: $($Global:Results.CreditCards.Count)" -ForegroundColor White
        Write-Host "Usuarios encontrados: $($Global:Results.Users.Count)" -ForegroundColor White
        
        # Guardar resultados
        $finalResults = @{
            ScanInfo = @{
                FilePath = $FilePath
                FileSize = $fileSize
                TotalBlocks = $totalBlocks
                BlockSize = $BlockSize
                ProcessedBlocks = $Global:Results.ProcessedBlocks
                StartTime = $Global:Results.StartTime
                EndTime = Get-Date
                TotalTime = ((Get-Date) - $Global:Results.StartTime).TotalMinutes
            }
            FinancialData = @{
                Balances = $Global:Results.Balances
                Transactions = $Global:Results.Transactions
                Accounts = $Global:Results.Accounts
                CreditCards = $Global:Results.CreditCards
                Users = $Global:Results.Users
            }
            Totals = @{
                EUR = $Global:Results.TotalEUR
                USD = $Global:Results.TotalUSD
                GBP = $Global:Results.TotalGBP
            }
        }
        
        $finalResults | ConvertTo-Json -Depth 10 | Out-File (Join-Path $OutputDir "simple-results.json") -Encoding UTF8
        
        Write-Host "`nArchivo guardado: $OutputDir\simple-results.json" -ForegroundColor Green
        Write-Host "ESCANEO SIMPLE COMPLETADO EXITOSAMENTE" -ForegroundColor Green
        
    }
    catch {
        Write-Host "Error en escaneo: $($_.Exception.Message)" -ForegroundColor Red
    }
    finally {
        if ($reader) { $reader.Close() }
        if ($stream) { $stream.Close() }
    }
}

# Ejecutar escaneo simple
Start-SimpleScan
