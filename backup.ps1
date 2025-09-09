# Script de Backup y Restauracion
param(
    [string]$Action = "backup",
    [string]$BackupPath = "backups",
    [string]$BackupName = ""
)

if (-not (Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$defaultBackupName = "corebanking_backup_$timestamp"

if ($Action -eq "backup") {
    Write-Host "=== CREANDO BACKUP ===" -ForegroundColor Cyan
    
    if (-not $BackupName) {
        $BackupName = $defaultBackupName
    }
    
    $backupDir = Join-Path $BackupPath $BackupName
    
    # Crear directorio de backup
    New-Item -ItemType Directory -Path $backupDir -Force
    
    # Backup de archivos de configuracion
    Write-Host "Backup de archivos de configuracion..." -ForegroundColor Yellow
    if (Test-Path "apps\api\.env") {
        Copy-Item "apps\api\.env" "$backupDir\api_env.txt"
    }
    if (Test-Path "apps\dashboard\.env.local") {
        Copy-Item "apps\dashboard\.env.local" "$backupDir\dashboard_env.txt"
    }
    
    # Backup de package.json
    Copy-Item "apps\api\package.json" "$backupDir\api_package.json"
    Copy-Item "apps\dashboard\package.json" "$backupDir\dashboard_package.json"
    
    # Backup de docker-compose.yml
    Copy-Item "docker-compose.yml" "$backupDir\docker_compose.yml"
    
    # Backup de scripts
    Copy-Item "*.ps1" "$backupDir\"
    
    # Crear archivo de informacion del backup
    $backupInfo = @"
Backup creado: $(Get-Date)
Version Node.js: $(node --version)
Version npm: $(npm --version)
Directorio: $backupDir
"@
    $backupInfo | Out-File "$backupDir\backup_info.txt"
    
    Write-Host "Backup completado: $backupDir" -ForegroundColor Green
    
} elseif ($Action -eq "restore") {
    Write-Host "=== RESTAURANDO BACKUP ===" -ForegroundColor Cyan
    
    if (-not $BackupName) {
        Write-Host "ERROR: Debes especificar el nombre del backup" -ForegroundColor Red
        exit 1
    }
    
    $backupDir = Join-Path $BackupPath $BackupName
    
    if (-not (Test-Path $backupDir)) {
        Write-Host "ERROR: Backup no encontrado: $backupDir" -ForegroundColor Red
        exit 1
    }
    
    # Restaurar archivos de configuracion
    Write-Host "Restaurando archivos de configuracion..." -ForegroundColor Yellow
    if (Test-Path "$backupDir\api_env.txt") {
        Copy-Item "$backupDir\api_env.txt" "apps\api\.env" -Force
    }
    if (Test-Path "$backupDir\dashboard_env.txt") {
        Copy-Item "$backupDir\dashboard_env.txt" "apps\dashboard\.env.local" -Force
    }
    
    # Restaurar package.json
    Copy-Item "$backupDir\api_package.json" "apps\api\package.json" -Force
    Copy-Item "$backupDir\dashboard_package.json" "apps\dashboard\package.json" -Force
    
    # Restaurar docker-compose.yml
    Copy-Item "$backupDir\docker_compose.yml" "docker-compose.yml" -Force
    
    Write-Host "Restauracion completada desde: $backupDir" -ForegroundColor Green
    
} elseif ($Action -eq "list") {
    Write-Host "=== LISTA DE BACKUPS ===" -ForegroundColor Cyan
    
    if (Test-Path $BackupPath) {
        $backups = Get-ChildItem $BackupPath -Directory
        if ($backups) {
            foreach ($backup in $backups) {
                $infoFile = Join-Path $backup.FullName "backup_info.txt"
                if (Test-Path $infoFile) {
                    $info = Get-Content $infoFile | Select-Object -First 1
                    Write-Host "$($backup.Name): $info" -ForegroundColor Green
                } else {
                    Write-Host "$($backup.Name)" -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "No hay backups disponibles" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Directorio de backups no existe" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "Uso: .\backup.ps1 [backup|restore|list] [nombre_backup]" -ForegroundColor Yellow
    Write-Host "Ejemplos:" -ForegroundColor Yellow
    Write-Host "  .\backup.ps1 backup" -ForegroundColor Gray
    Write-Host "  .\backup.ps1 backup mi_backup" -ForegroundColor Gray
    Write-Host "  .\backup.ps1 restore mi_backup" -ForegroundColor Gray
    Write-Host "  .\backup.ps1 list" -ForegroundColor Gray
}
