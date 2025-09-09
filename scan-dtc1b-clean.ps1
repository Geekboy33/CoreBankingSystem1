# SCRIPT LIMPIO SIN CARACTERES ESPECIALES
param(
    [string]$FilePath = "E:\final AAAA\dtc1b",
    [string]$OutputDir = "E:\final AAAA\corebanking\extracted-data",
    [int]$ChunkSize = 50MB
)

Write-Host "=== SCRIPT LIMPIO Y FUNCIONAL ===" -ForegroundColor Green
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
    CreditCards = @()
    Users = @()
    TotalEUR = 0.0
    TotalUSD = 0.0
    TotalGBP = 0.0
    StartTime = Get-Date
}

# Función para buscar balances
function Find-Balances {
    param([string]$filePath)
    
    Write-Host "`nBuscando balances..." -ForegroundColor Cyan
    
    try {
        $fileInfo = Get-Item $filePath
        $fileSize = $fileInfo.Length
        $totalChunks = [math]::Ceiling($fileSize / $ChunkSize)
        
        Write-Host "Procesando $totalChunks chunks" -ForegroundColor Yellow
        
        $stream = [System.IO.File]::OpenRead($filePath)
        $reader = New-Object System.IO.StreamReader($stream)
        
        for ($chunk = 0; $chunk -lt $totalChunks; $chunk++) {
            $buffer = New-Object char[] $ChunkSize
            $bytesRead = $reader.Read($buffer, 0, $ChunkSize)
            $content = [string]::new($buffer, 0, $bytesRead)
            
            # Buscar balances EUR
            $eurPattern = '(?i)(?:EUR|euro)[:\s]*([0-9,]+\.?[0-9]*)'
            $eurMatches = [regex]::Matches($content, $eurPattern)
            foreach ($match in $eurMatches) {
                $value = $match.Groups[1].Value.Trim()
                if ($value -match '^[0-9,]+\.?[0-9]*$') {
                    $balance = [double]($value -replace ',', '')
                    $Global:Results.Balances += @{
                        Balance = $balance
                        Currency = "EUR"
                        RawValue = $value
                        Chunk = $chunk
                    }
                    $Global:Results.TotalEUR += $balance
                }
            }
            
            # Buscar balances USD
            $usdPattern = '(?i)(?:USD|dollar)[:\s]*([0-9,]+\.?[0-9]*)'
            $usdMatches = [regex]::Matches($content, $usdPattern)
            foreach ($match in $usdMatches) {
                $value = $match.Groups[1].Value.Trim()
                if ($value -match '^[0-9,]+\.?[0-9]*$') {
                    $balance = [double]($value -replace ',', '')
                    $Global:Results.Balances += @{
                        Balance = $balance
                        Currency = "USD"
                        RawValue = $value
                        Chunk = $chunk
                    }
                    $Global:Results.TotalUSD += $balance
                }
            }
            
            # Buscar balances GBP
            $gbpPattern = '(?i)(?:GBP|pound)[:\s]*([0-9,]+\.?[0-9]*)'
            $gbpMatches = [regex]::Matches($content, $gbpPattern)
            foreach ($match in $gbpMatches) {
                $value = $match.Groups[1].Value.Trim()
                if ($value -match '^[0-9,]+\.?[0-9]*$') {
                    $balance = [double]($value -replace ',', '')
                    $Global:Results.Balances += @{
                        Balance = $balance
                        Currency = "GBP"
                        RawValue = $value
                        Chunk = $chunk
                    }
                    $Global:Results.TotalGBP += $balance
                }
            }
            
            # Mostrar progreso
            $percent = [math]::Round((($chunk + 1) / $totalChunks) * 100, 2)
            Write-Progress -Activity "Buscando balances" -Status "Chunk $($chunk + 1) de $totalChunks ($percent por ciento)" -PercentComplete $percent
            
            # Mostrar resultados parciales cada 100 chunks
            if (($chunk + 1) % 100 -eq 0) {
                Write-Host "Chunk $($chunk + 1): EUR=$($Global:Results.TotalEUR.ToString('N2')), USD=$($Global:Results.TotalUSD.ToString('N2')), GBP=$($Global:Results.TotalGBP.ToString('N2'))" -ForegroundColor Green
            }
        }
        
        $reader.Close()
        $stream.Close()
        Write-Progress -Activity "Buscando balances" -Completed
        
        Write-Host "Balances encontrados: $($Global:Results.Balances.Count)" -ForegroundColor Green
    }
    catch {
        Write-Host "Error buscando balances: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Función para buscar tarjetas de crédito
function Find-CreditCards {
    param([string]$filePath)
    
    Write-Host "`nBuscando tarjetas de credito..." -ForegroundColor Cyan
    
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
            
            # Buscar tarjetas de crédito
            $cardPattern = '([0-9]{4}[ ]?[0-9]{4}[ ]?[0-9]{4}[ ]?[0-9]{4})'
            $cardMatches = [regex]::Matches($content, $cardPattern)
            foreach ($match in $cardMatches) {
                $cardNumber = $match.Value -replace ' ', ''
                if ($cardNumber.Length -eq 16) {
                    $Global:Results.CreditCards += @{
                        CardNumber = $cardNumber
                        Chunk = $chunk
                    }
                }
            }
            
            # Mostrar progreso
            $percent = [math]::Round((($chunk + 1) / $totalChunks) * 100, 2)
            Write-Progress -Activity "Buscando tarjetas" -Status "Chunk $($chunk + 1) de $totalChunks ($percent por ciento)" -PercentComplete $percent
        }
        
        $reader.Close()
        $stream.Close()
        Write-Progress -Activity "Buscando tarjetas" -Completed
        
        Write-Host "Tarjetas encontradas: $($Global:Results.CreditCards.Count)" -ForegroundColor Green
    }
    catch {
        Write-Host "Error buscando tarjetas: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Función para buscar usuarios
function Find-Users {
    param([string]$filePath)
    
    Write-Host "`nBuscando usuarios..." -ForegroundColor Cyan
    
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
            
            # Buscar usuarios
            $userPattern = '(?i)(?:user|username|email|customer)[:\s]*([A-Za-z0-9_\.@]+)'
            $userMatches = [regex]::Matches($content, $userPattern)
            foreach ($match in $userMatches) {
                $value = $match.Groups[1].Value.Trim()
                if ($value.Length -gt 2) {
                    $Global:Results.Users += @{
                        Username = $value
                        Chunk = $chunk
                    }
                }
            }
            
            # Mostrar progreso
            $percent = [math]::Round((($chunk + 1) / $totalChunks) * 100, 2)
            Write-Progress -Activity "Buscando usuarios" -Status "Chunk $($chunk + 1) de $totalChunks ($percent por ciento)" -PercentComplete $percent
        }
        
        $reader.Close()
        $stream.Close()
        Write-Progress -Activity "Buscando usuarios" -Completed
        
        Write-Host "Usuarios encontrados: $($Global:Results.Users.Count)" -ForegroundColor Green
    }
    catch {
        Write-Host "Error buscando usuarios: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Función principal
function Start-CleanScan {
    try {
        Write-Host "`n=== INICIANDO ESCANEO LIMPIO ===" -ForegroundColor Green
        
        $fileInfo = Get-Item $FilePath
        Write-Host "Archivo: $([math]::Round($fileInfo.Length/1GB, 2)) GB" -ForegroundColor Green
        
        # Buscar balances
        Find-Balances $FilePath
        
        # Buscar tarjetas
        Find-CreditCards $FilePath
        
        # Buscar usuarios
        Find-Users $FilePath
        
        # Mostrar resultados finales
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
                Method = "Clean Script"
            }
            Results = $Global:Results
        }
        
        $finalResults | ConvertTo-Json -Depth 10 | Out-File (Join-Path $OutputDir "clean-results.json") -Encoding UTF8
        
        Write-Host "`nArchivo guardado: $OutputDir\clean-results.json" -ForegroundColor Green
        Write-Host "ESCANEO LIMPIO COMPLETADO EXITOSAMENTE" -ForegroundColor Green
        
    }
    catch {
        Write-Host "Error en escaneo: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Ejecutar escaneo
Start-CleanScan
