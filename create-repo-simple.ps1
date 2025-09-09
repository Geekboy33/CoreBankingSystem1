# Script simple para crear repositorio en GitHub
Write-Host "=== CREANDO REPOSITORIO EN GITHUB ===" -ForegroundColor Green

# Verificar GitHub CLI
try {
    gh --version | Out-Null
    Write-Host "GitHub CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "GitHub CLI no encontrado. Instalando..." -ForegroundColor Yellow
    winget install --id GitHub.cli
}

# Crear repositorio
Write-Host "Creando repositorio..." -ForegroundColor Cyan
gh repo create core-banking-system --public --description "Core Banking System with DTC1B Dashboard - Complete web dashboard with massive scanning capabilities"

# Hacer push
Write-Host "Subiendo código..." -ForegroundColor Cyan
git push -u origin main

Write-Host "✅ Repositorio creado y código subido!" -ForegroundColor Green
Write-Host "🔗 URL: https://github.com/Geekboy33/core-banking-system" -ForegroundColor Cyan
