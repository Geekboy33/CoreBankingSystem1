# Script para buscar CVV y usuarios en archivos existentes
param(
    [string]$DTC1BPath = "E:\dtc1b"
)

Write-Host "=== BUSQUEDA ESPECIFICA CVV Y USUARIOS ===" -ForegroundColor Cyan
Write-Host "Directorio: $DTC1BPath" -ForegroundColor Yellow

# Obtener todos los archivos
$allFiles = Get-ChildItem $DTC1BPath -File -Recurse -ErrorAction SilentlyContinue
$totalFiles = $allFiles.Count

Write-Host "Encontrados $totalFiles archivos" -ForegroundColor Yellow

$allCreditCards = @()
$allUsers = @()
$allBalancesEUR = @()

foreach ($file in $allFiles) {
    Write-Host "Analizando: $($file.Name)" -ForegroundColor Gray
    
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $content) { continue }
        
        # Buscar tarjetas de credito
        $cardPatterns = @(
            '([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})',
            'card[:\s]+([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})',
            'credit[:\s]+([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})',
            'visa[:\s]+([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})',
            'mastercard[:\s]+([0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})'
        )
        
        # Buscar CVV
        $cvvPatterns = @(
            'cvv[:\s]+([0-9]{3,4})',
            'cvc[:\s]+([0-9]{3,4})',
            'cvv2[:\s]+([0-9]{3,4})',
            'security[:\s]+([0-9]{3,4})',
            'code[:\s]+([0-9]{3,4})',
            '([0-9]{3,4})'
        )
        
        # Buscar usuarios
        $userPatterns = @(
            'user[:\s]+([A-Za-z0-9_\-\.]+)',
            'username[:\s]+([A-Za-z0-9_\-\.]+)',
            'login[:\s]+([A-Za-z0-9_\-\.]+)',
            'email[:\s]+([A-Za-z0-9_\-\.@]+)',
            'customer[:\s]+([A-Za-z0-9_\-\.]+)',
            'client[:\s]+([A-Za-z0-9_\-\.]+)'
        )
        
        # Buscar balances en euros
        $eurPatterns = @(
            'EUR[:\s]+([0-9,]+\.?[0-9]*)',
            'euro[:\s]+([0-9,]+\.?[0-9]*)',
            'balance[:\s]+([0-9,]+\.?[0-9]*)',
            'saldo[:\s]+([0-9,]+\.?[0-9]*)'
        )
        
        # Procesar tarjetas de credito
        foreach ($pattern in $cardPatterns) {
            $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            foreach ($match in $matches) {
                $cardNumber = $match.Groups[1].Value -replace '[\s\-]', ''
                if ($cardNumber.Length -eq 16) {
                    # Buscar CVV cercano
                    $cvv = "N/A"
                    foreach ($cvvPattern in $cvvPatterns) {
                        $cvvMatches = [regex]::Matches($content, $cvvPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                        foreach ($cvvMatch in $cvvMatches) {
                            if ([math]::Abs($cvvMatch.Index - $match.Index) -lt 500) {
                                $cvv = $cvvMatch.Groups[1].Value
                                break
                            }
                        }
                        if ($cvv -ne "N/A") { break }
                    }
                    
                    $allCreditCards += @{
                        File = $file.Name
                        CardNumber = $cardNumber
                        CVV = $cvv
                        Position = $match.Index
                    }
                }
            }
        }
        
        # Procesar usuarios
        foreach ($pattern in $userPatterns) {
            $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            foreach ($match in $matches) {
                $username = $match.Groups[1].Value.Trim()
                if ($username.Length -gt 2) {
                    $allUsers += @{
                        File = $file.Name
                        Username = $username
                        Position = $match.Index
                    }
                }
            }
        }
        
        # Procesar balances EUR
        foreach ($pattern in $eurPatterns) {
            $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            foreach ($match in $matches) {
                $balance = [double]($match.Groups[1].Value -replace ',', '')
                if ($balance -gt 0) {
                    $allBalancesEUR += @{
                        File = $file.Name
                        Balance = $balance
                        Currency = "EUR"
                        Position = $match.Index
                    }
                }
            }
        }
        
    }
    catch {
        Write-Host "Error analizando $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Mostrar resultados
Write-Host "`n=== RESUMEN BUSQUEDA ESPECIFICA ===" -ForegroundColor Cyan
Write-Host "Archivos procesados: $totalFiles" -ForegroundColor Green

Write-Host "`n=== TARJETAS DE CREDITO CON CVV ===" -ForegroundColor Yellow
$uniqueCards = $allCreditCards | Group-Object CardNumber | Sort-Object Count -Descending
foreach ($card in $uniqueCards | Select-Object -First 10) {
    $cardInfo = $card.Group[0]
    Write-Host "$($cardInfo.CardNumber) - CVV: $($cardInfo.CVV) - Archivo: $($cardInfo.File)" -ForegroundColor Green
}

Write-Host "`n=== USUARIOS ENCONTRADOS ===" -ForegroundColor Yellow
$uniqueUsers = $allUsers | Group-Object Username | Sort-Object Count -Descending
foreach ($user in $uniqueUsers | Select-Object -First 10) {
    Write-Host "$($user.Name) - $($user.Count) ocurrencias" -ForegroundColor Green
}

Write-Host "`n=== BALANCES EUR ENCONTRADOS ===" -ForegroundColor Yellow
$totalEUR = ($allBalancesEUR | Measure-Object -Property Balance -Sum).Sum
Write-Host "Total EUR encontrado: EUR $($totalEUR.ToString('N2'))" -ForegroundColor Green

foreach ($balance in $allBalancesEUR | Sort-Object Balance -Descending | Select-Object -First 10) {
    Write-Host "$($balance.File): EUR $($balance.Balance.ToString('N2'))" -ForegroundColor Green
}

# Guardar resultados
$results = @{
    TotalFiles = $totalFiles
    CreditCards = $allCreditCards
    Users = $allUsers
    BalancesEUR = $allBalancesEUR
    TotalEUR = $totalEUR
    ScanDate = Get-Date
}

$results | ConvertTo-Json -Depth 10 | Out-File "dtc1b-cvv-users-results.json" -Encoding UTF8
Write-Host "`nResultados guardados en: dtc1b-cvv-users-results.json" -ForegroundColor Cyan

Write-Host "`n=== BUSQUEDA ESPECIFICA COMPLETADA ===" -ForegroundColor Green
