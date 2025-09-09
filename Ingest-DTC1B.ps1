param(
  [ValidateSet("Local","Docker")]
  [string]$Mode = "Local",
  [string]$InputPath = "E:\dtc1b",
  [string]$Out = "E:\outputs\ingest",
  [int]$ChunkMB = 64
)
$env:INPUT_PATH = $InputPath
$env:OUTPUT_DIR = $Out
$env:CHUNK_SIZE = ($ChunkMB * 1024 * 1024)

Write-Host "📁 INPUT_PATH: $env:INPUT_PATH"
Write-Host "📂 OUTPUT_DIR: $env:OUTPUT_DIR"
Write-Host "📦 CHUNK_SIZE: $env:CHUNK_SIZE"

New-Item -ItemType Directory -Force -Path $Out | Out-Null

if ($Mode -eq "Local") {
  Push-Location ".\services\ingest-dtc1b"
  if (-not (Test-Path "node_modules")) { npm install }
  npx tsx src/index.ts
  Pop-Location
} else {
  docker compose build ingest
  docker compose run --rm ingest
}

Write-Host "✅ Ingesta finalizada. Revisa $Out"
