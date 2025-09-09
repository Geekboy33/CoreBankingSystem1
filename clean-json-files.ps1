# Limpiar archivos JSON corruptos
$ErrorActionPreference = 'Stop'

$Root = $PSScriptRoot
$JsonFiles = @(
    "dtc1b-scan-results.json",
    "dtc1b-robust-scan-results.json",
    "dtc1b-scan-simple-results.json"
)

Write-Host "Limpiando archivos JSON corruptos..." -ForegroundColor Cyan

foreach ($file in $JsonFiles) {
    $filePath = Join-Path $Root $file
    
    if (Test-Path $filePath) {
        Write-Host "Procesando: $file" -ForegroundColor Yellow
        
        try {
            # Leer el archivo como texto
            $content = Get-Content $filePath -Raw -Encoding UTF8
            
            # Limpiar caracteres problemáticos
            $cleanContent = $content -replace "[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "" -replace "^\uFEFF", ""
            
            # Crear backup
            $backupPath = $filePath + ".backup"
            Copy-Item $filePath $backupPath -Force
            
            # Escribir contenido limpio
            $cleanContent | Out-File $filePath -Encoding UTF8 -NoNewline
            
            # Verificar que el JSON es válido
            $json = Get-Content $filePath -Raw | ConvertFrom-Json
            Write-Host "✅ $file limpiado correctamente" -ForegroundColor Green
            
        } catch {
            Write-Host "❌ Error limpiando $file : $($_.Exception.Message)" -ForegroundColor Red
            
            # Restaurar backup si existe
            if (Test-Path $backupPath) {
                Copy-Item $backupPath $filePath -Force
                Write-Host "Archivo restaurado desde backup" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "⚠️ Archivo no encontrado: $file" -ForegroundColor Yellow
    }
}

Write-Host "Limpieza completada" -ForegroundColor Green




