# Script para crear repositorio en GitHub automáticamente
param(
    [string]$RepoName = "core-banking-system",
    [string]$Description = "Core Banking System with DTC1B Dashboard - Complete web dashboard with massive scanning capabilities",
    [string]$Visibility = "public"
)

Write-Host "=== CREANDO REPOSITORIO EN GITHUB ===" -ForegroundColor Green
Write-Host "Nombre del repositorio: $RepoName" -ForegroundColor Yellow
Write-Host "Descripción: $Description" -ForegroundColor Yellow
Write-Host "Visibilidad: $Visibility" -ForegroundColor Yellow

# Verificar si GitHub CLI está instalado
try {
    $ghVersion = gh --version
    Write-Host "GitHub CLI encontrado: $ghVersion" -ForegroundColor Green
} catch {
    Write-Host "GitHub CLI no encontrado. Instalando..." -ForegroundColor Yellow
    
    # Instalar GitHub CLI usando winget
    try {
        winget install --id GitHub.cli
        Write-Host "GitHub CLI instalado correctamente" -ForegroundColor Green
    } catch {
        Write-Host "Error instalando GitHub CLI. Instálalo manualmente desde: https://cli.github.com/" -ForegroundColor Red
        Write-Host "O crea el repositorio manualmente en: https://github.com/new" -ForegroundColor Yellow
        exit 1
    }
}

# Autenticar con GitHub
Write-Host "Autenticando con GitHub..." -ForegroundColor Cyan
try {
    gh auth login --web
    Write-Host "Autenticación exitosa" -ForegroundColor Green
} catch {
    Write-Host "Error en autenticación. Por favor, autentícate manualmente:" -ForegroundColor Red
    Write-Host "gh auth login" -ForegroundColor Yellow
    exit 1
}

# Crear repositorio
Write-Host "Creando repositorio en GitHub..." -ForegroundColor Cyan
try {
    if ($Visibility -eq "public") {
        gh repo create $RepoName --public --description $Description --source=. --remote=origin --push
    } else {
        gh repo create $RepoName --private --description $Description --source=. --remote=origin --push
    }
    
    Write-Host "✅ Repositorio creado exitosamente!" -ForegroundColor Green
    Write-Host "🔗 URL: https://github.com/Geekboy33/$RepoName" -ForegroundColor Cyan
    
} catch {
    Write-Host "Error creando repositorio: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Creando repositorio manualmente..." -ForegroundColor Yellow
    
    # Crear repositorio sin push automático
    try {
        if ($Visibility -eq "public") {
            gh repo create $RepoName --public --description $Description
        } else {
            gh repo create $RepoName --private --description $Description
        }
        
        Write-Host "Repositorio creado. Ahora haciendo push..." -ForegroundColor Yellow
        git push -u origin main
        
        Write-Host "✅ Proyecto subido exitosamente!" -ForegroundColor Green
        Write-Host "🔗 URL: https://github.com/Geekboy33/$RepoName" -ForegroundColor Cyan
        
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Por favor, crea el repositorio manualmente en: https://github.com/new" -ForegroundColor Yellow
    }
}

Write-Host "=== PROCESO COMPLETADO ===" -ForegroundColor Green
