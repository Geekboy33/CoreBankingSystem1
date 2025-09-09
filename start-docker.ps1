# Script de inicio con Docker Compose
Write-Host "=== INICIANDO CORE BANKING CON DOCKER ===" -ForegroundColor Cyan

# Verificar Docker
try {
    $dockerVersion = docker --version
    Write-Host "Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker no encontrado" -ForegroundColor Red
    Write-Host "Instala Docker Desktop desde https://docker.com/" -ForegroundColor Red
    exit 1
}

# Verificar Docker Compose
try {
    $composeVersion = docker-compose --version
    Write-Host "Docker Compose encontrado: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker Compose no encontrado" -ForegroundColor Red
    exit 1
}

# Detener contenedores anteriores
Write-Host "Deteniendo contenedores anteriores..." -ForegroundColor Yellow
docker-compose down

# Construir imágenes
Write-Host "Construyendo imágenes..." -ForegroundColor Yellow
docker-compose build

# Iniciar servicios
Write-Host "Iniciando servicios..." -ForegroundColor Yellow
docker-compose up -d

# Esperar a que los servicios estén listos
Write-Host "Esperando a que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Verificar servicios
Write-Host "Verificando servicios..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 10 -UseBasicParsing
    Write-Host "API OK: http://localhost:8080" -ForegroundColor Green
} catch {
    Write-Host "API no responde en puerto 8080" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10 -UseBasicParsing
    Write-Host "Dashboard OK: http://localhost:3000" -ForegroundColor Green
    Start-Process "http://localhost:3000"
} catch {
    Write-Host "Dashboard no responde en puerto 3000" -ForegroundColor Red
}

# Mostrar logs
Write-Host "Mostrando logs de los servicios..." -ForegroundColor Yellow
docker-compose logs --tail=10

Write-Host "=== SISTEMA INICIADO CON DOCKER ===" -ForegroundColor Green
Write-Host "Para ver logs: docker-compose logs -f" -ForegroundColor Yellow
Write-Host "Para detener: docker-compose down" -ForegroundColor Yellow
