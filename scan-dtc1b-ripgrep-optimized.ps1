# SCRIPT OPTIMIZADO CON RIPGREP - BÚSQUEDAS ULTRA RÁPIDAS
param(
    [string]$FilePath = "E:\final AAAA\dtc1b",
    [string]$OutputDir = "E:\final AAAA\corebanking\extracted-data",
    [int]$ChunkSize = 100MB
)

Write-Host "=== SCRIPT OPTIMIZADO CON RIPGREP ===" -ForegroundColor Cyan
Write-Host "Archivo: $FilePath" -ForegroundColor Yellow
Write-Host "Salida: $OutputDir" -ForegroundColor Yellow
Write-Host "Chunk: $([math]::Round($ChunkSize/1MB, 1)) MB" -ForegroundColor Yellow

# Crear directorio de salida
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "Directorio creado: $OutputDir" -ForegroundColor Green
}

# Variables globales
$Global:Results = @{
    Balances = @()
    Transactions = @()
    Accounts = @()
    CreditCards = @()
    Users = @()
    TotalEUR = 0.0
    TotalUSD = 0.0
    TotalGBP = 0.0
    StartTime = Get-Date
}

# Función para usar RipGrep si está disponible
function Search-WithRipGrep {
    param([string]$pattern, [string]$filePath)
    
    try {
        # Intentar usar RipGrep
        $rgPath = Get-Command rg -ErrorAction SilentlyContinue
        if ($rgPath) {
            $results = & rg --no-heading --no-line-number --only-matching $pattern $filePath
            return $results
        }
    }
    catch {
        Write-Host "RipGrep no disponible, usando PowerShell" -ForegroundColor Yellow
    }
    
    # Fallback a PowerShell
    return $null
}

# Función para buscar balances con RipGrep
function Find-Balances {
    param([string]$filePath)
    
    Write-Host "`n🔍 Buscando balances con RipGrep..." -ForegroundColor Cyan
    
    $patterns = @(
        '(?i)(?:balance|saldo|amount|monto)[:\s]*([0-9,]+\.?[0-9]*)',
        '(?i)(?:EUR|euro)[:\s]*([0-9,]+\.?[0-9]*)',
        '(?i)(?:USD|dollar)[:\s]*([0-9,]+\.?[0-9]*)',
        '(?i)(?:GBP|pound)[:\s]*([0-9,]+\.?[0-9]*)'
    )
    
    foreach ($pattern in $patterns) {
        Write-Host "Buscando patrón: $pattern" -ForegroundColor Yellow
        
        try {
            # Usar RipGrep si está disponible
            $rgResults = Search-WithRipGrep $pattern $filePath
            if ($rgResults) {
                foreach ($result in $rgResults) {
                    if ($result -match '^[0-9,]+\.?[0-9]*$') {
                        $balance = [double]($result -replace ',', '')
                        $currency = if ($pattern -match 'EUR') { "EUR" } elseif ($pattern -match 'USD') { "USD" } elseif ($pattern -match 'GBP') { "GBP" } else { "EUR" }
                        
                        $Global:Results.Balances += @{
                            Balance = $balance
                            Currency = $currency
                            RawValue = $result
                            Method = "RipGrep"
                        }
                        
                        switch ($currency) {
                            "EUR" { $Global:Results.TotalEUR += $balance }
                            "USD" { $Global:Results.TotalUSD += $balance }
                            "GBP" { $Global:Results.TotalGBP += $balance }
                        }
                    }
                }
            }
            else {
                # Fallback a PowerShell con chunks
                Find-BalancesPowerShell $pattern $filePath
            }
        }
        catch {
            Write-Host "Error con patrón $pattern : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Función fallback para PowerShell
function Find-BalancesPowerShell {
    param([string]$pattern, [string]$filePath)
    
    Write-Host "Usando PowerShell para patrón: $pattern" -ForegroundColor Yellow
    
    try {
        $fileInfo = Get-Item $filePath
        $fileSize = $fileInfo.Length
        $totalChunks = [math]::Ceiling($fileSize / $ChunkSize)
        
        $stream = [System.IO.File]::OpenRead($filePath)
        $reader = New-Object System.IO.StreamReader($stream)
        
        for ($chunk = 0; $chunk -lt $totalChunks; $chunk++) {
            $buffer = New-Object char[] $ChunkSize
            $bytesRead = $reader.Read($buffer, 0, $ChunkSize)
            $content = [string]::new($buffer, 0, $bytesRead)
            
            $matches = [regex]::Matches($content, $pattern)
            foreach ($match in $matches) {
                $value = $match.Groups[1].Value.Trim()
                if ($value -match '^[0-9,]+\.?[0-9]*$') {
                    $balance = [double]($value -replace ',', '')
                    $currency = if ($pattern -match 'EUR') { "EUR" } elseif ($pattern -match 'USD') { "USD" } elseif ($pattern -match 'GBP') { "GBP" } else { "EUR" }
                    
                    $Global:Results.Balances += @{
                        Balance = $balance
                        Currency = $currency
                        RawValue = $value
                        Method = "PowerShell"
                        Chunk = $chunk
                    }
                    
                    switch ($currency) {
                        "EUR" { $Global:Results.TotalEUR += $balance }
                        "USD" { $Global:Results.TotalUSD += $balance }
                        "GBP" { $Global:Results.TotalGBP += $balance }
                    }
                }
            }
            
            # Mostrar progreso
            $percent = [math]::Round((($chunk + 1) / $totalChunks) * 100, 2)
            Write-Progress -Activity "Buscando balances" -Status "Chunk $($chunk + 1) de $totalChunks ($percent%)" -PercentComplete $percent
        }
        
        $reader.Close()
        $stream.Close()
        Write-Progress -Activity "Buscando balances" -Completed
    }
    catch {
        Write-Host "Error en PowerShell fallback: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Función para buscar tarjetas de crédito
function Find-CreditCards {
    param([string]$filePath)
    
    Write-Host "`n💳 Buscando tarjetas de crédito..." -ForegroundColor Cyan
    
    $pattern = '([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})'
    
    try {
        $rgResults = Search-WithRipGrep $pattern $filePath
        if ($rgResults) {
            foreach ($result in $rgResults) {
                $cardNumber = $result -replace '[\s\-]', ''
                if ($cardNumber.Length -eq 16) {
                    $Global:Results.CreditCards += @{
                        CardNumber = $cardNumber
                        Method = "RipGrep"
                    }
                }
            }
        }
        else {
            # Fallback a PowerShell
            Find-CreditCardsPowerShell $pattern $filePath
        }
    }
    catch {
        Write-Host "Error buscando tarjetas: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Función fallback para tarjetas
function Find-CreditCardsPowerShell {
    param([string]$pattern, [string]$filePath)
    
    try {
        $fileInfo = Get-Item $filePath
        $fileSize = $fileInfo.Length
        $totalChunks = [math]::Ceiling($fileSize / $ChunkSize)
        
        $stream = [System.IO.File]::OpenRead($filePath)
        $reader = New-Object System.IO.StreamReader($stream)
        
        for ($chunk = 0; $chunk -lt $totalChunks; $chunk++) {
            $buffer = New-Object char[] $ChunkSize
            $bytesRead = $reader.Read($buffer, 0, $ChunkSize)
            $content = [string]::new($buffer, 0, $bytesRead)
            
            $matches = [regex]::Matches($content, $pattern)
            foreach ($match in $matches) {
                $cardNumber = $match.Value -replace '[\s\-]', ''
                if ($cardNumber.Length -eq 16) {
                    $Global:Results.CreditCards += @{
                        CardNumber = $cardNumber
                        Method = "PowerShell"
                        Chunk = $chunk
                    }
                }
            }
            
            $percent = [math]::Round((($chunk + 1) / $totalChunks) * 100, 2)
            Write-Progress -Activity "Buscando tarjetas" -Status "Chunk $($chunk + 1) de $totalChunks ($percent%)" -PercentComplete $percent
        }
        
        $reader.Close()
        $stream.Close()
        Write-Progress -Activity "Buscando tarjetas" -Completed
    }
    catch {
        Write-Host "Error en PowerShell fallback para tarjetas: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Función para buscar usuarios
function Find-Users {
    param([string]$filePath)
    
    Write-Host "`n👤 Buscando usuarios..." -ForegroundColor Cyan
    
    $pattern = '(?i)(?:user|username|email|customer)[:\s]*([A-Za-z0-9_\-\.@]+)'
    
    try {
        $rgResults = Search-WithRipGrep $pattern $filePath
        if ($rgResults) {
            foreach ($result in $rgResults) {
                if ($result.Length -gt 2) {
                    $Global:Results.Users += @{
                        Username = $result
                        Method = "RipGrep"
                    }
                }
            }
        }
        else {
            # Fallback a PowerShell
            Find-UsersPowerShell $pattern $filePath
        }
    }
    catch {
        Write-Host "Error buscando usuarios: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Función fallback para usuarios
function Find-UsersPowerShell {
    param([string]$pattern, [string]$filePath)
    
    try {
        $fileInfo = Get-Item $filePath
        $fileSize = $fileInfo.Length
        $totalChunks = [math]::Ceiling($fileSize / $ChunkSize)
        
        $stream = [System.IO.File]::OpenRead($filePath)
        $reader = New-Object System.IO.StreamReader($stream)
        
        for ($chunk = 0; $chunk -lt $totalChunks; $chunk++) {
            $buffer = New-Object char[] $ChunkSize
            $bytesRead = $reader.Read($buffer, 0, $ChunkSize)
            $content = [string]::new($buffer, 0, $bytesRead)
            
            $matches = [regex]::Matches($content, $pattern)
            foreach ($match in $matches) {
                $value = $match.Groups[1].Value.Trim()
                if ($value.Length -gt 2) {
                    $Global:Results.Users += @{
                        Username = $value
                        Method = "PowerShell"
                        Chunk = $chunk
                    }
                }
            }
            
            $percent = [math]::Round((($chunk + 1) / $totalChunks) * 100, 2)
            Write-Progress -Activity "Buscando usuarios" -Status "Chunk $($chunk + 1) de $totalChunks ($percent%)" -PercentComplete $percent
        }
        
        $reader.Close()
        $stream.Close()
        Write-Progress -Activity "Buscando usuarios" -Completed
    }
    catch {
        Write-Host "Error en PowerShell fallback para usuarios: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Función principal
function Start-RipGrepScan {
    try {
        Write-Host "`n=== INICIANDO ESCANEO CON RIPGREP ===" -ForegroundColor Green
        
        $fileInfo = Get-Item $FilePath
        Write-Host "Archivo: $([math]::Round($fileInfo.Length/1GB, 2)) GB" -ForegroundColor Green
        
        # Buscar balances
        Find-Balances $FilePath
        
        # Buscar tarjetas
        Find-CreditCards $FilePath
        
        # Buscar usuarios
        Find-Users $FilePath
        
        # Mostrar resultados
        Write-Host "`n=== RESULTADOS FINALES ===" -ForegroundColor Cyan
        Write-Host "Total EUR: $($Global:Results.TotalEUR.ToString('N2'))" -ForegroundColor Green
        Write-Host "Total USD: $($Global:Results.TotalUSD.ToString('N2'))" -ForegroundColor Green
        Write-Host "Total GBP: $($Global:Results.TotalGBP.ToString('N2'))" -ForegroundColor Green
        
        Write-Host "`n=== ESTADISTICAS ===" -ForegroundColor Yellow
        Write-Host "Balances encontrados: $($Global:Results.Balances.Count)" -ForegroundColor White
        Write-Host "Tarjetas encontradas: $($Global:Results.CreditCards.Count)" -ForegroundColor White
        Write-Host "Usuarios encontrados: $($Global:Results.Users.Count)" -ForegroundColor White
        
        # Guardar resultados
        $finalResults = @{
            ScanInfo = @{
                FilePath = $FilePath
                FileSize = $fileInfo.Length
                StartTime = $Global:Results.StartTime
                EndTime = Get-Date
                TotalTime = ((Get-Date) - $Global:Results.StartTime).TotalMinutes
                Method = "RipGrep Optimized"
            }
            Results = $Global:Results
        }
        
        $finalResults | ConvertTo-Json -Depth 10 | Out-File (Join-Path $OutputDir "ripgrep-results.json") -Encoding UTF8
        
        Write-Host "`nArchivo guardado: $OutputDir\ripgrep-results.json" -ForegroundColor Green
        Write-Host "ESCANEO CON RIPGREP COMPLETADO EXITOSAMENTE" -ForegroundColor Green
        
    }
    catch {
        Write-Host "Error en escaneo: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Ejecutar escaneo
Start-RipGrepScan
