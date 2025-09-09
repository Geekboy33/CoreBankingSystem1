# 📚 Documentación de la API Core Banking

## 🌐 Información General

- **Base URL**: `http://localhost:8080`
- **Versión**: v1
- **Formato**: JSON
- **Autenticación**: No requerida (desarrollo)

## 🔗 Endpoints Principales

### Health Check
```http
GET /health
```

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

### Balances del Libro Mayor
```http
GET /api/v1/ledger/balances
```

**Respuesta:**
```json
{
  "balances": [
    {
      "account_id": "ACC:EUR:001",
      "currency": "EUR",
      "balance": "1000.00"
    },
    {
      "account_id": "ACC:USD:001", 
      "currency": "USD",
      "balance": "1500.00"
    }
  ]
}
```

### Balances por Moneda
```http
GET /api/v1/ledger/balances/by-currency
```

**Respuesta:**
```json
{
  "EUR": "1000.00",
  "USD": "1500.00"
}
```

### Balance de Prueba
```http
GET /api/v1/ledger/trial-balance
```

**Respuesta:**
```json
{
  "total_debits": "2500.00",
  "total_credits": "2500.00",
  "balance": "0.00",
  "accounts": [
    {
      "account_id": "ACC:EUR:001",
      "debits": "1000.00",
      "credits": "0.00"
    }
  ]
}
```

### Balance Consolidado en EUR
```http
GET /api/v1/ledger/consolidated-eur
```

**Respuesta:**
```json
{
  "total_eur_equivalent": "2750.00",
  "exchange_rates": {
    "USD": 1.15
  },
  "breakdown": [
    {
      "currency": "EUR",
      "amount": "1000.00",
      "eur_equivalent": "1000.00"
    },
    {
      "currency": "USD", 
      "amount": "1500.00",
      "eur_equivalent": "1725.00"
    }
  ]
}
```

### Transacciones
```http
GET /api/v1/ledger/transactions?limit=50&offset=0
```

**Parámetros:**
- `limit` (opcional): Número de transacciones (default: 50)
- `offset` (opcional): Desplazamiento (default: 0)

**Respuesta:**
```json
{
  "transactions": [
    {
      "id": "txn_001",
      "from_account": "ACC:EUR:001",
      "to_account": "ACC:EUR:002", 
      "amount": "500.00",
      "currency": "EUR",
      "description": "Transferencia",
      "timestamp": "2024-01-15T10:30:00Z",
      "status": "completed"
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

### Crear Transferencia
```http
POST /api/v1/transfers
```

**Headers:**
```
Content-Type: application/json
Idempotency-Key: 9c76c84e-6a2d-4a6e-9b1a-4b7680c2d111
```

**Body:**
```json
{
  "from_account": "ACC:EUR:001",
  "to_account": "ACC:EUR:002",
  "amount": "500.00",
  "currency": "EUR",
  "reference": "Settlement"
}
```

**Respuesta:**
```json
{
  "transfer_id": "txn_002",
  "status": "completed",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Tipos de Cambio
```http
GET /api/v1/fx
```

**Respuesta:**
```json
{
  "rates": {
    "USD": 1.15,
    "GBP": 0.86,
    "JPY": 160.50
  },
  "base": "EUR",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Establecer Tipo de Cambio
```http
POST /api/v1/fx/rate
```

**Body:**
```json
{
  "from_currency": "EUR",
  "to_currency": "USD", 
  "rate": 1.15
}
```

### Analizar Archivo DTC1B
```http
POST /api/v1/ingest/analyze
```

**Headers:**
```
Content-Type: multipart/form-data
```

**Body:** Archivo binario DTC1B

**Respuesta:**
```json
{
  "fileName": "dtc1b_sample.bin",
  "fileSize": 1024000,
  "encoding": "UTF-8",
  "lines": 1024,
  "patterns": {
    "accountPatterns": 25,
    "transactionPatterns": 150,
    "datePatterns": 75,
    "amountPatterns": 100
  },
  "preview": [
    "ACC001|EUR|1000.00|2024-01-15|Transferencia inicial",
    "ACC002|USD|1500.00|2024-01-15|Deposito"
  ]
}
```

### Promover Datos Staging → Ledger
```http
POST /api/v1/ingest/promote?batch=1000
```

**Parámetros:**
- `batch` (opcional): Tamaño del lote (default: 1000)

**Respuesta:**
```json
{
  "promoted": 1000,
  "remaining": 500,
  "status": "completed"
}
```

## 🔌 WebSocket

### Conexión
```
ws://localhost:8080/ws
```

### Eventos

**Balance Update:**
```json
{
  "type": "balance_update",
  "account_id": "ACC:EUR:001",
  "new_balance": "1000.00",
  "currency": "EUR",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Transaction Created:**
```json
{
  "type": "transaction_created",
  "transaction": {
    "id": "txn_001",
    "from_account": "ACC:EUR:001",
    "to_account": "ACC:EUR:002",
    "amount": "500.00",
    "currency": "EUR"
  }
}
```

## 🚨 Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Datos inválidos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Clave de idempotencia duplicada |
| 422 | Unprocessable Entity - Error de validación |
| 500 | Internal Server Error - Error del servidor |

## 📝 Ejemplos de Uso

### cURL

**Obtener balances:**
```bash
curl -X GET "http://localhost:8080/api/v1/ledger/balances"
```

**Crear transferencia:**
```bash
curl -X POST "http://localhost:8080/api/v1/transfers" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 9c76c84e-6a2d-4a6e-9b1a-4b7680c2d111" \
  -d '{
    "from_account": "ACC:EUR:001",
    "to_account": "ACC:EUR:002", 
    "amount": "500.00",
    "currency": "EUR",
    "reference": "Settlement"
  }'
```

**Analizar archivo:**
```bash
curl -X POST "http://localhost:8080/api/v1/ingest/analyze" \
  -F "file=@dtc1b_sample.bin"
```

### JavaScript

```javascript
// Obtener balances
const balances = await fetch('/api/v1/ledger/balances')
  .then(res => res.json());

// Crear transferencia
const transfer = await fetch('/api/v1/transfers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Idempotency-Key': crypto.randomUUID()
  },
  body: JSON.stringify({
    from_account: 'ACC:EUR:001',
    to_account: 'ACC:EUR:002',
    amount: '500.00',
    currency: 'EUR',
    reference: 'Settlement'
  })
}).then(res => res.json());

// WebSocket
const ws = new WebSocket('ws://localhost:8080/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('WebSocket message:', data);
};
```

## 🔧 Configuración

### Variables de Entorno

```env
# Servidor
PORT=8080
NODE_ENV=development

# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=core
DB_PASS=corepass
DB_NAME=corebank

# Cron (opcional)
CRON_PROMOTE=0
PROMOTE_BATCH=1000
CRON_EXPR=*/5 * * * *
```

## 📊 Monitoreo

### Health Check
```bash
curl http://localhost:8080/health
```

### Métricas
- Tiempo de respuesta promedio
- Número de transacciones por minuto
- Uso de memoria
- Errores por endpoint

## 🔒 Seguridad

### Recomendaciones
- Usar HTTPS en producción
- Implementar autenticación JWT
- Validar todas las entradas
- Usar claves de idempotencia únicas
- Limitar tamaño de archivos
- Implementar rate limiting
