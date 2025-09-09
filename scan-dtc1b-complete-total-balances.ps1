# Script de Escaneo Completo DTC1B - Extracción Total de Balances
# Versión: 1.0 - Escaneo Masivo Completo
# Objetivo: Extraer TODOS los balances del archivo DTC1B de 800GB

param(
    [string]$FilePath = "E:\final AAAA\dtc1b",
    [int]$BlockSizeMB = 200,
    [int]$MaxParallelJobs = 8,
    [string]$OutputPath = "E:\final AAAA\corebanking\extracted-data"
)

# Configuración inicial
$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Crear directorio de salida si no existe
if (!(Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force
}

# Patrones de búsqueda optimizados
$Patterns = @{
    # Balances en diferentes formatos
    'EUR_Balance' = @(
        '\b\d{1,8}\.\d{2}\s*EUR\b',
        '\bEUR\s*\d{1,8}\.\d{2}\b',
        '\b\d{1,8}\.\d{2}\s*€\b',
        '\b€\s*\d{1,8}\.\d{2}\b',
        '\b\d{1,8}\.\d{2}\s*EURO\b',
        '\bEURO\s*\d{1,8}\.\d{2}\b'
    )
    'USD_Balance' = @(
        '\b\d{1,8}\.\d{2}\s*USD\b',
        '\bUSD\s*\d{1,8}\.\d{2}\b',
        '\b\d{1,8}\.\d{2}\s*\$',
        '\b\$\s*\d{1,8}\.\d{2}\b',
        '\b\d{1,8}\.\d{2}\s*DOLLAR\b',
        '\bDOLLAR\s*\d{1,8}\.\d{2}\b'
    )
    'GBP_Balance' = @(
        '\b\d{1,8}\.\d{2}\s*GBP\b',
        '\bGBP\s*\d{1,8}\.\d{2}\b',
        '\b\d{1,8}\.\d{2}\s*£\b',
        '\b£\s*\d{1,8}\.\d{2}\b',
        '\b\d{1,8}\.\d{2}\s*POUND\b',
        '\bPOUND\s*\d{1,8}\.\d{2}\b'
    )
    'BTC_Balance' = @(
        '\b\d{1,8}\.\d{8}\s*BTC\b',
        '\bBTC\s*\d{1,8}\.\d{8}\b',
        '\b\d{1,8}\.\d{8}\s*BITCOIN\b',
        '\bBITCOIN\s*\d{1,8}\.\d{8}\b'
    )
    'ETH_Balance' = @(
        '\b\d{1,8}\.\d{8}\s*ETH\b',
        '\bETH\s*\d{1,8}\.\d{8}\b',
        '\b\d{1,8}\.\d{8}\s*ETHEREUM\b',
        '\bETHEREUM\s*\d{1,8}\.\d{8}\b'
    )
}

# Función para extraer números de texto
function Extract-Number {
    param([string]$Text)
    
    # Buscar números con decimales
    $numberPattern = '\b\d{1,8}\.\d{1,8}\b'
    $matches = [regex]::Matches($Text, $numberPattern)
    
    if ($matches.Count -gt 0) {
        return [double]$matches[0].Value
    }
    
    # Buscar números enteros
    $intPattern = '\b\d{1,8}\b'
    $intMatches = [regex]::Matches($Text, $intPattern)
    
    if ($intMatches.Count -gt 0) {
        return [double]$intMatches[0].Value
    }
    
    return 0
}

# Función para detectar moneda
function Detect-Currency {
    param([string]$Text)
    
    $Text = $Text.ToUpper()
    
    if ($Text -match 'EUR|€|EURO') { return 'EUR' }
    if ($Text -match 'USD|\$|DOLLAR') { return 'USD' }
    if ($Text -match 'GBP|£|POUND') { return 'GBP' }
    if ($Text -match 'BTC|BITCOIN') { return 'BTC' }
    if ($Text -match 'ETH|ETHEREUM') { return 'ETH' }
    
    return 'UNKNOWN'
}

# Función para procesar un bloque de datos
function Process-DataBlock {
    param(
        [byte[]]$BlockData,
        [int]$BlockNumber,
        [long]$StartPosition
    )
    
    try {
        # Convertir bytes a texto
        $text = [System.Text.Encoding]::UTF8.GetString($BlockData)
        
        $results = @{
            BlockNumber = $BlockNumber
            StartPosition = $StartPosition
            Balances = @()
            Transactions = @()
            Accounts = @()
            CreditCards = @()
            Users = @()
            EthereumWallets = @()
            DAESData = @()
            BinaryData = @()
        }
        
        # Procesar cada patrón de moneda
        foreach ($currency in $Patterns.Keys) {
            foreach ($pattern in $Patterns[$currency]) {
                $matches = [regex]::Matches($text, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                
                foreach ($match in $matches) {
                    $amount = Extract-Number $match.Value
                    $detectedCurrency = Detect-Currency $match.Value
                    
                    if ($amount -gt 0) {
                        $balance = @{
                            Amount = $amount
                            Currency = $detectedCurrency
                            RawValue = $match.Value
                            Position = $StartPosition + $match.Index
                            Block = $BlockNumber
                            Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
                            Pattern = $pattern
                        }
                        
                        $results.Balances += $balance
                    }
                }
            }
        }
        
        # Buscar transacciones
        $transactionPattern = '\b(TRANSFER|PAYMENT|DEPOSIT|WITHDRAWAL)\s+\d{1,8}\.\d{2}\s+(EUR|USD|GBP|BTC|ETH)\b'
        $transactionMatches = [regex]::Matches($text, $transactionPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        
        foreach ($match in $transactionMatches) {
            $transaction = @{
                Type = $match.Groups[1].Value
                Amount = Extract-Number $match.Value
                Currency = Detect-Currency $match.Value
                RawValue = $match.Value
                Position = $StartPosition + $match.Index
                Block = $BlockNumber
                Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
            }
            
            $results.Transactions += $transaction
        }
        
        # Buscar cuentas bancarias
        $accountPattern = '\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b'
        $accountMatches = [regex]::Matches($text, $accountPattern)
        
        foreach ($match in $accountMatches) {
            $account = @{
                AccountNumber = $match.Value
                Position = $StartPosition + $match.Index
                Block = $BlockNumber
                Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
            }
            
            $results.Accounts += $account
        }
        
        # Buscar tarjetas de crédito
        $cardPattern = '\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b'
        $cardMatches = [regex]::Matches($text, $cardPattern)
        
        foreach ($match in $cardMatches) {
            $card = @{
                CardNumber = $match.Value
                Position = $StartPosition + $match.Index
                Block = $BlockNumber
                Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
            }
            
            $results.CreditCards += $card
        }
        
        # Buscar wallets Ethereum
        $ethWalletPattern = '\b0x[a-fA-F0-9]{40}\b'
        $ethMatches = [regex]::Matches($text, $ethWalletPattern)
        
        foreach ($match in $ethMatches) {
            $wallet = @{
                Address = $match.Value
                Position = $StartPosition + $match.Index
                Block = $BlockNumber
                Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
            }
            
            $results.EthereumWallets += $wallet
        }
        
        return $results
        
    } catch {
        Write-Warning "Error procesando bloque $BlockNumber : $($_.Exception.Message)"
        return $null
    }
}

# Función principal de escaneo
function Start-CompleteScan {
    param(
        [string]$FilePath,
        [int]$BlockSizeMB,
        [int]$MaxParallelJobs
    )
    
    Write-Host "=== INICIANDO ESCANEO COMPLETO DTC1B ===" -ForegroundColor Green
    Write-Host "Archivo: $FilePath" -ForegroundColor Yellow
    Write-Host "Tamaño de bloque: $BlockSizeMB MB" -ForegroundColor Yellow
    Write-Host "Jobs paralelos: $MaxParallelJobs" -ForegroundColor Yellow
    Write-Host "Timestamp: $(Get-Date)" -ForegroundColor Yellow
    Write-Host ""
    
    # Verificar que el archivo existe
    if (!(Test-Path $FilePath)) {
        Write-Error "Archivo no encontrado: $FilePath"
        return
    }
    
    $fileInfo = Get-Item $FilePath
    $fileSize = $fileInfo.Length
    $blockSize = $BlockSizeMB * 1024 * 1024
    $totalBlocks = [Math]::Ceiling($fileSize / $blockSize)
    
    Write-Host "Tamaño del archivo: $([Math]::Round($fileSize / 1GB, 2)) GB" -ForegroundColor Cyan
    Write-Host "Total de bloques: $totalBlocks" -ForegroundColor Cyan
    Write-Host ""
    
    # Variables para resultados
    $allBalances = @()
    $allTransactions = @()
    $allAccounts = @()
    $allCreditCards = @()
    $allUsers = @()
    $allEthereumWallets = @()
    $allDAESData = @()
    $allBinaryData = @()
    
    $startTime = Get-Date
    $processedBlocks = 0
    $totalBytesProcessed = 0
    
    # Abrir archivo para lectura
    $fileStream = [System.IO.File]::OpenRead($FilePath)
    
    try {
        # Procesar bloques en paralelo
        $jobs = @()
        
        for ($i = 0; $i -lt $totalBlocks; $i += $MaxParallelJobs) {
            # Limpiar jobs completados
            $jobs = $jobs | Where-Object { $_.State -ne 'Completed' -and $_.State -ne 'Failed' }
            
            # Crear nuevos jobs si hay espacio
            while ($jobs.Count -lt $MaxParallelJobs -and $i -lt $totalBlocks) {
                $blockNumber = $i
                $startPosition = $i * $blockSize
                $currentBlockSize = [Math]::Min($blockSize, $fileSize - $startPosition)
                
                # Leer bloque de datos
                $blockData = New-Object byte[] $currentBlockSize
                $fileStream.Seek($startPosition, [System.IO.SeekOrigin]::Begin) | Out-Null
                $bytesRead = $fileStream.Read($blockData, 0, $currentBlockSize)
                
                if ($bytesRead -gt 0) {
                    # Crear job para procesar bloque
                    $job = Start-Job -ScriptBlock {
                        param($BlockData, $BlockNumber, $StartPosition)
                        Process-DataBlock -BlockData $BlockData -BlockNumber $BlockNumber -StartPosition $StartPosition
                    } -ArgumentList $blockData, $blockNumber, $startPosition
                    
                    $jobs += $job
                }
                
                $i++
            }
            
            # Esperar a que algunos jobs terminen
            if ($jobs.Count -eq $MaxParallelJobs) {
                $completedJobs = $jobs | Where-Object { $_.State -eq 'Completed' }
                
                foreach ($job in $completedJobs) {
                    $result = Receive-Job $job
                    Remove-Job $job
                    
                    if ($result) {
                        $allBalances += $result.Balances
                        $allTransactions += $result.Transactions
                        $allAccounts += $result.Accounts
                        $allCreditCards += $result.CreditCards
                        $allUsers += $result.Users
                        $allEthereumWallets += $result.EthereumWallets
                        $allDAESData += $result.DAESData
                        $allBinaryData += $result.BinaryData
                        
                        $processedBlocks++
                        $totalBytesProcessed += $blockSize
                        
                        # Mostrar progreso
                        $progress = ($processedBlocks / $totalBlocks) * 100
                        $elapsed = (Get-Date) - $startTime
                        $estimatedTotal = if ($progress -gt 0) { $elapsed.TotalMinutes / ($progress / 100) } else { 0 }
                        $estimatedRemaining = $estimatedTotal - $elapsed.TotalMinutes
                        
                        Write-Progress -Activity "Escaneando DTC1B" -Status "Procesando bloque $processedBlocks de $totalBlocks" -PercentComplete $progress
                        
                        if ($processedBlocks % 100 -eq 0) {
                            Write-Host "Progreso: $([Math]::Round($progress, 2))% - Bloques: $processedBlocks/$totalBlocks - Balances: $($allBalances.Count) - Tiempo: $([Math]::Round($elapsed.TotalMinutes, 2)) min" -ForegroundColor Green
                        }
                    }
                }
            }
        }
        
        # Esperar a que todos los jobs terminen
        Write-Host "Esperando a que terminen los jobs restantes..." -ForegroundColor Yellow
        $jobs | Wait-Job | Out-Null
        
        foreach ($job in $jobs) {
            $result = Receive-Job $job
            Remove-Job $job
            
            if ($result) {
                $allBalances += $result.Balances
                $allTransactions += $result.Transactions
                $allAccounts += $result.Accounts
                $allCreditCards += $result.CreditCards
                $allUsers += $result.Users
                $allEthereumWallets += $result.EthereumWallets
                $allDAESData += $result.DAESData
                $allBinaryData += $result.BinaryData
                
                $processedBlocks++
                $totalBytesProcessed += $blockSize
            }
        }
        
    } finally {
        $fileStream.Close()
    }
    
    $endTime = Get-Date
    $totalTime = $endTime - $startTime
    
    Write-Host ""
    Write-Host "=== ESCANEO COMPLETADO ===" -ForegroundColor Green
    Write-Host "Tiempo total: $([Math]::Round($totalTime.TotalMinutes, 2)) minutos" -ForegroundColor Cyan
    Write-Host "Bloques procesados: $processedBlocks" -ForegroundColor Cyan
    Write-Host "Bytes procesados: $([Math]::Round($totalBytesProcessed / 1GB, 2)) GB" -ForegroundColor Cyan
    Write-Host ""
    
    # Calcular balances totales por moneda
    $totalBalances = @{
        EUR = 0
        USD = 0
        GBP = 0
        BTC = 0
        ETH = 0
    }
    
    foreach ($balance in $allBalances) {
        $currency = $balance.Currency
        if ($totalBalances.ContainsKey($currency)) {
            $totalBalances[$currency] += $balance.Amount
        }
    }
    
    Write-Host "=== BALANCES TOTALES EXTRAÍDOS ===" -ForegroundColor Green
    Write-Host "EUR Total: $($totalBalances.EUR.ToString('N2'))" -ForegroundColor Yellow
    Write-Host "USD Total: $($totalBalances.USD.ToString('N2'))" -ForegroundColor Yellow
    Write-Host "GBP Total: $($totalBalances.GBP.ToString('N2'))" -ForegroundColor Yellow
    Write-Host "BTC Total: $($totalBalances.BTC.ToString('N8'))" -ForegroundColor Yellow
    Write-Host "ETH Total: $($totalBalances.ETH.ToString('N8'))" -ForegroundColor Yellow
    Write-Host ""
    
    # Estadísticas finales
    Write-Host "=== ESTADÍSTICAS FINALES ===" -ForegroundColor Green
    Write-Host "Total Balances: $($allBalances.Count)" -ForegroundColor Cyan
    Write-Host "Total Transacciones: $($allTransactions.Count)" -ForegroundColor Cyan
    Write-Host "Total Cuentas: $($allAccounts.Count)" -ForegroundColor Cyan
    Write-Host "Total Tarjetas: $($allCreditCards.Count)" -ForegroundColor Cyan
    Write-Host "Total Wallets ETH: $($allEthereumWallets.Count)" -ForegroundColor Cyan
    Write-Host "Total DAES: $($allDAESData.Count)" -ForegroundColor Cyan
    Write-Host "Total Binary: $($allBinaryData.Count)" -ForegroundColor Cyan
    Write-Host ""
    
    # Crear objeto de resultados completo
    $completeResults = @{
        scanId = "COMPLETE_SCAN_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        mode = "COMPLETE_TOTAL_BALANCES_SCAN"
        progress = @{
            currentBlock = $processedBlocks
            totalBlocks = $totalBlocks
            percentage = 100
            elapsedMinutes = $totalTime.TotalMinutes
            estimatedRemaining = 0
            bytesProcessed = $totalBytesProcessed
            totalBytes = $fileSize
            averageSpeedMBps = [Math]::Round(($totalBytesProcessed / 1MB) / $totalTime.TotalSeconds, 2)
            memoryUsageMB = [Math]::Round(([System.GC]::GetTotalMemory($false) / 1MB), 2)
        }
        balances = $totalBalances
        statistics = @{
            balancesFound = $allBalances.Count
            transactionsFound = $allTransactions.Count
            accountsFound = $allAccounts.Count
            creditCardsFound = $allCreditCards.Count
            usersFound = $allUsers.Count
            daesDataFound = $allDAESData.Count
            ethereumWalletsFound = $allEthereumWallets.Count
            swiftCodesFound = 0
            ssnsFound = 0
        }
        recentData = @{
            balances = $allBalances | Select-Object -First 100
            transactions = $allTransactions | Select-Object -First 100
            accounts = $allAccounts | Select-Object -First 100
            creditCards = $allCreditCards | Select-Object -First 100
            users = $allUsers | Select-Object -First 100
            ethereumWallets = $allEthereumWallets | Select-Object -First 100
        }
        timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
    }
    
    # Guardar resultados en archivo JSON
    $outputFile = Join-Path $OutputPath "complete-total-balances-scan.json"
    $completeResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputFile -Encoding UTF8
    
    Write-Host "Resultados guardados en: $outputFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "=== ESCANEO COMPLETO FINALIZADO ===" -ForegroundColor Green
    
    return $completeResults
}

# Ejecutar escaneo completo
try {
    $results = Start-CompleteScan -FilePath $FilePath -BlockSizeMB $BlockSizeMB -MaxParallelJobs $MaxParallelJobs
    
    # Mostrar resumen final
    Write-Host ""
    Write-Host "=== RESUMEN FINAL ===" -ForegroundColor Magenta
    Write-Host "Archivo escaneado: $FilePath" -ForegroundColor White
    Write-Host "Tamaño total: $([Math]::Round((Get-Item $FilePath).Length / 1GB, 2)) GB" -ForegroundColor White
    Write-Host "Balances EUR: $($results.balances.EUR.ToString('N2'))" -ForegroundColor White
    Write-Host "Balances USD: $($results.balances.USD.ToString('N2'))" -ForegroundColor White
    Write-Host "Balances GBP: $($results.balances.GBP.ToString('N2'))" -ForegroundColor White
    Write-Host "Balances BTC: $($results.balances.BTC.ToString('N8'))" -ForegroundColor White
    Write-Host "Balances ETH: $($results.balances.ETH.ToString('N8'))" -ForegroundColor White
    Write-Host "Total elementos encontrados: $($results.statistics.balancesFound)" -ForegroundColor White
    
} catch {
    Write-Error "Error durante el escaneo: $($_.Exception.Message)"
    Write-Error "Stack trace: $($_.Exception.StackTrace)"
}

Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")





