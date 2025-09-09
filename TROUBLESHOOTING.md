# 🔧 Guía de Troubleshooting

## 🚨 Problemas Comunes y Soluciones

### 1. **API No Inicia**

**Síntomas:**
- Error: `Port 8080 is already in use`
- Error: `Cannot find module`
- API no responde en `http://localhost:8080/health`

**Soluciones:**

```powershell
# Verificar qué usa el puerto 8080
netstat -ano | findstr :8080

# Detener proceso específico
taskkill /PID <PID> /F

# Limpiar y reiniciar
.\limpiar.ps1
.\start-simple.ps1
```

**Verificaciones:**
- Node.js instalado: `node --version`
- Dependencias instaladas: `cd apps/api && npm install`
- Puerto libre: `netstat -ano | findstr :8080`

### 2. **Dashboard No Inicia**

**Síntomas:**
- Error: `Port 3000 is already in use`
- Dashboard no carga en `http://localhost:3000`
- Error: `Module not found`

**Soluciones:**

```powershell
# Verificar puerto 3000
netstat -ano | findstr :3000

# Reinstalar dependencias del dashboard
cd apps/dashboard
npm install
npm run dev
```

**Verificaciones:**
- Next.js instalado: `npm list next`
- Archivo `.env.local` existe
- API está ejecutándose

### 3. **Error: "Failed to fetch"**

**Síntomas:**
- Dashboard muestra "Failed to fetch"
- No se conecta a la API
- Errores de CORS

**Soluciones:**

```powershell
# Verificar que la API esté ejecutándose
curl http://localhost:8080/health

# Verificar configuración del dashboard
cat apps/dashboard/.env.local

# Reiniciar ambos servicios
.\limpiar.ps1
.\start-simple.ps1
```

**Verificaciones:**
- API responde: `curl http://localhost:8080/health`
- Configuración correcta en `.env.local`
- CORS configurado en la API

### 4. **Problemas de Dependencias**

**Síntomas:**
- Error: `Cannot find module`
- Error: `Package not found`
- TypeScript errors

**Soluciones:**

```powershell
# Limpiar node_modules
cd apps/api
Remove-Item node_modules -Recurse -Force
npm install

cd ../dashboard
Remove-Item node_modules -Recurse -Force
npm install
```

**Verificaciones:**
- `package.json` actualizado
- `npm install` ejecutado
- Versiones compatibles

### 5. **Problemas de Docker**

**Síntomas:**
- Error: `Docker not found`
- Error: `docker-compose not found`
- Contenedores no inician

**Soluciones:**

```powershell
# Verificar Docker
docker --version
docker-compose --version

# Reiniciar Docker Desktop
# Limpiar contenedores
docker-compose down
docker system prune -f

# Reconstruir
docker-compose build --no-cache
docker-compose up -d
```

**Verificaciones:**
- Docker Desktop ejecutándose
- Docker Compose instalado
- Puertos disponibles

### 6. **Problemas de Base de Datos**

**Síntomas:**
- Error: `Connection refused`
- Error: `Database not found`
- Migraciones fallan

**Soluciones:**

```powershell
# Verificar PostgreSQL
docker-compose up db -d

# Verificar conexión
psql -h localhost -U core -d corebank

# Ejecutar migraciones
cd apps/api
npm run migrate
```

**Verificaciones:**
- PostgreSQL ejecutándose
- Credenciales correctas
- Base de datos creada

### 7. **Problemas de Archivos DTC1B**

**Síntomas:**
- Error al cargar archivo
- Error de análisis
- Archivo no encontrado

**Soluciones:**

```powershell
# Verificar archivo
Test-Path "E:\dtc1b"

# Verificar permisos
Get-Acl "E:\dtc1b"

# Probar con archivo pequeño
.\Ingest-DTC1B.ps1 -Mode Local -InputPath "sample.bin"
```

**Verificaciones:**
- Archivo existe y es accesible
- Formato correcto
- Tamaño manejable

## 🔍 Diagnóstico Avanzado

### Script de Diagnóstico Completo

```powershell
# Ejecutar diagnóstico completo
.\diagnostico.ps1

# Monitoreo en tiempo real
.\monitor.ps1 -Continuous

# Verificar logs
Get-Content "apps\api\logs\*.log" -Tail 50
```

### Verificación de Red

```powershell
# Verificar conectividad
Test-NetConnection localhost -Port 8080
Test-NetConnection localhost -Port 3000

# Verificar DNS
nslookup localhost

# Verificar firewall
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Node*"}
```

### Verificación de Recursos

```powershell
# Uso de CPU y memoria
Get-Process node | Select-Object ProcessName, CPU, WorkingSet

# Espacio en disco
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, FreeSpace, Size

# Puertos en uso
netstat -ano | findstr LISTENING
```

## 🛠️ Herramientas de Debugging

### 1. **Logs de la API**

```powershell
# Ver logs en tiempo real
Get-Content "apps\api\logs\api.log" -Wait

# Filtrar errores
Get-Content "apps\api\logs\api.log" | Select-String "ERROR"
```

### 2. **Logs del Dashboard**

```powershell
# Ver logs de Next.js
cd apps/dashboard
npm run dev

# Ver logs en navegador
# F12 -> Console -> Errores
```

### 3. **Logs de Docker**

```powershell
# Ver logs de todos los servicios
docker-compose logs

# Ver logs específicos
docker-compose logs api
docker-compose logs dashboard
docker-compose logs db
```

## 🔧 Comandos Útiles

### PowerShell

```powershell
# Verificar procesos Node.js
Get-Process node

# Detener todos los procesos Node.js
Get-Process node | Stop-Process -Force

# Verificar puertos
netstat -ano | findstr ":8080\|:3000"

# Verificar servicios
Get-Service | Where-Object {$_.Name -like "*node*"}
```

### cURL

```bash
# Verificar API
curl -X GET http://localhost:8080/health

# Verificar Dashboard
curl -X GET http://localhost:3000

# Probar endpoint específico
curl -X GET http://localhost:8080/api/v1/ledger/balances
```

### Docker

```bash
# Ver contenedores
docker ps -a

# Ver logs
docker logs <container_id>

# Ejecutar comando en contenedor
docker exec -it <container_id> /bin/bash

# Ver uso de recursos
docker stats
```

## 📞 Escalación de Problemas

### 1. **Recopilar Información**

```powershell
# Crear reporte de diagnóstico
$report = @{
    Timestamp = Get-Date
    NodeVersion = node --version
    NpmVersion = npm --version
    DockerVersion = docker --version
    Processes = Get-Process node | Select-Object Id, ProcessName, WorkingSet
    Ports = netstat -ano | findstr ":8080\|:3000"
}

$report | ConvertTo-Json | Out-File "diagnostico_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
```

### 2. **Pasos de Escalación**

1. **Ejecutar diagnóstico básico**
2. **Revisar logs de error**
3. **Verificar configuración**
4. **Probar en entorno limpio**
5. **Documentar problema**

### 3. **Información Necesaria**

- Versión de Node.js
- Versión de npm
- Sistema operativo
- Logs de error
- Configuración actual
- Pasos para reproducir

## 🚀 Optimizaciones

### 1. **Rendimiento**

```powershell
# Limpiar cache
npm cache clean --force

# Optimizar dependencias
npm dedupe

# Verificar tamaño de node_modules
Get-ChildItem node_modules -Recurse | Measure-Object -Property Length -Sum
```

### 2. **Memoria**

```powershell
# Configurar límites de memoria
$env:NODE_OPTIONS="--max-old-space-size=4096"

# Monitorear uso de memoria
Get-Process node | Select-Object ProcessName, WorkingSet, PrivateMemorySize
```

### 3. **Red**

```powershell
# Optimizar conexiones
# En .env: DB_POOL_SIZE=10

# Verificar latencia
Test-NetConnection localhost -Port 8080
```

## 📚 Recursos Adicionales

- [Documentación de Node.js](https://nodejs.org/docs/)
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Fastify](https://fastify.io/docs/)
- [Documentación de Docker](https://docs.docker.com/)
- [Documentación de PostgreSQL](https://www.postgresql.org/docs/)
