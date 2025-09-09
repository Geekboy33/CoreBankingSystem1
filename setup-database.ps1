# Script para configurar PostgreSQL
Write-Host "=== CONFIGURANDO POSTGRESQL ===" -ForegroundColor Cyan

# Verificar si Docker está disponible
try {
    $dockerVersion = docker --version
    Write-Host "Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker no encontrado" -ForegroundColor Red
    Write-Host "Instala Docker Desktop desde https://docker.com/" -ForegroundColor Red
    exit 1
}

# Iniciar PostgreSQL con Docker
Write-Host "Iniciando PostgreSQL..." -ForegroundColor Yellow
docker run --name corebank-postgres `
    -e POSTGRES_USER=core `
    -e POSTGRES_PASSWORD=corepass `
    -e POSTGRES_DB=corebank `
    -p 5432:5432 `
    -d postgres:16

# Esperar a que PostgreSQL esté listo
Write-Host "Esperando a que PostgreSQL esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Crear archivo de migración inicial
$migrationFile = "apps\api\migrations\001_initial_schema.sql"
if (-not (Test-Path "apps\api\migrations")) {
    New-Item -ItemType Directory -Path "apps\api\migrations" -Force
}

@"
-- Migración inicial para Core Banking
-- Crear tablas del sistema de libro mayor

CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    account_id VARCHAR(50) UNIQUE NOT NULL,
    currency VARCHAR(3) NOT NULL,
    balance DECIMAL(20,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journals (
    id SERIAL PRIMARY KEY,
    journal_id VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id SERIAL PRIMARY KEY,
    journal_id VARCHAR(50) REFERENCES journals(journal_id),
    account_id VARCHAR(50) REFERENCES accounts(account_id),
    debit DECIMAL(20,2) DEFAULT 0.00,
    credit DECIMAL(20,2) DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    journal_id VARCHAR(50) REFERENCES journals(journal_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fx_rates (
    id SERIAL PRIMARY KEY,
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(10,6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_currency, to_currency)
);

-- Insertar datos iniciales
INSERT INTO accounts (account_id, currency, balance) VALUES
    ('ACC:EUR:001', 'EUR', 1000.00),
    ('ACC:USD:001', 'USD', 1500.00),
    ('ACC:EUR:002', 'EUR', 0.00),
    ('ACC:USD:002', 'USD', 0.00)
ON CONFLICT (account_id) DO NOTHING;

INSERT INTO fx_rates (from_currency, to_currency, rate) VALUES
    ('EUR', 'USD', 1.15),
    ('USD', 'EUR', 0.87),
    ('EUR', 'GBP', 0.86),
    ('GBP', 'EUR', 1.16)
ON CONFLICT (from_currency, to_currency) DO NOTHING;
"@ | Out-File -Encoding utf8 $migrationFile

Write-Host "Archivo de migración creado: $migrationFile" -ForegroundColor Green

# Crear script de migración
$migrateScript = "apps\api\migrate.js"
@"
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'core',
    password: process.env.DB_PASS || 'corepass',
    database: process.env.DB_NAME || 'corebank'
});

async function migrate() {
    try {
        await client.connect();
        console.log('Conectado a PostgreSQL');
        
        const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        await client.query(sql);
        console.log('Migración completada exitosamente');
        
    } catch (error) {
        console.error('Error en migración:', error);
    } finally {
        await client.end();
    }
}

migrate();
"@ | Out-File -Encoding utf8 $migrateScript

Write-Host "Script de migración creado: $migrateScript" -ForegroundColor Green

# Agregar script de migración al package.json de la API
$packageJsonPath = "apps\api\package.json"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
    $packageJson.scripts.migrate = "node migrate.js"
    $packageJson | ConvertTo-Json -Depth 10 | Out-File $packageJsonPath -Encoding utf8
    Write-Host "Script de migración agregado al package.json" -ForegroundColor Green
}

Write-Host "=== POSTGRESQL CONFIGURADO ===" -ForegroundColor Green
Write-Host "Para ejecutar migración: cd apps\api && npm run migrate" -ForegroundColor Yellow
