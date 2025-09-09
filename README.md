# Core Banking System - Dashboard DTC1B

Sistema bancario completo con dashboard web para análisis y gestión de datos DTC1B.

## 🚀 Características Principales

### Dashboard Web
- **Cuentas**: Gestión completa de cuentas bancarias
- **Transacciones**: Historial y seguimiento de transacciones
- **Integraciones**: Monitoreo de conexiones externas
- **Ajustes**: Configuración del sistema
- **Escaneo Masivo**: Análisis completo de datos DTC1B con barra de progreso

### Funcionalidades del Escaneo Masivo
- ✅ Barra de progreso en tiempo real
- ✅ Balance total en Euros, Dólares y Libras
- ✅ Extracción de balances, transacciones, cuentas, tarjetas y usuarios
- ✅ Integración completa con dashboard web
- ✅ Datos reales de DTC1B (800GB)

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Fastify, PostgreSQL
- **Scripts**: PowerShell para análisis masivo de datos
- **Datos**: DTC1B real (800GB de información bancaria)

## �� Instalación

### Prerrequisitos
- Node.js 18+
- npm o yarn
- PowerShell 5.1+
- PostgreSQL (opcional)

### Pasos de Instalación

1. **Clonar el repositorio**
`ash
git clone https://github.com/tu-usuario/core-banking-system.git
cd core-banking-system
`

2. **Instalar dependencias**
`ash
# API
cd apps/api
npm install

# Dashboard
cd ../dashboard
npm install
`

3. **Configurar variables de entorno**
`ash
# API (.env)
DB_HOST=localhost
DB_PORT=5432
DB_USER=core
DB_PASS=corepass
DB_NAME=corebank
PORT=8080

# Dashboard (.env.local)
NEXT_PUBLIC_API_BASE=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
`

4. **Iniciar servicios**
`ash
# Usar el script de inicio automático
./Start-CoreBanking.ps1

# O iniciar manualmente
cd apps/api && npm run dev
cd apps/dashboard && npm run dev
`

## 🚀 Uso Rápido

### Iniciar el Sistema
`powershell
# Ejecutar script de inicio completo
./Start-CoreBanking.ps1
`

### Acceder al Dashboard
- **Dashboard**: http://localhost:3000
- **API**: http://localhost:8080

### Escaneo Masivo DTC1B
1. Ir a la página principal del dashboard
2. Hacer clic en "Iniciar Escaneo" en el panel de Escaneo Masivo DTC1B
3. Monitorear el progreso en tiempo real
4. Ver balances totales en Euros, Dólares y Libras

## 📊 Funcionalidades del Dashboard

### Página Principal
- Panel de escaneo masivo con barra de progreso
- Tarjetas de balance en tiempo real
- Gráficos y tendencias
- Controles de escaneo

### Cuentas (/cuentas)
- Lista completa de cuentas bancarias
- Detalles de cada cuenta
- Resumen de cuentas activas
- Filtros y búsqueda

### Transacciones (/transacciones)
- Historial completo de transacciones
- Filtros por tipo, estado y período
- Detalles de transacciones
- Resumen estadístico

### Integraciones (/integraciones)
- Estado de conexiones externas
- Monitoreo en tiempo real
- Pruebas de conexión
- Logs del sistema

### Ajustes (/ajustes)
- Configuración del sistema
- Variables de entorno
- Estado del servidor
- Logs del sistema

## 🔧 Scripts de Análisis

### Escaneo Masivo DTC1B
`powershell
# Script integrado con dashboard
./scan-dtc1b-dashboard-integrated.ps1

# Scripts adicionales disponibles
./scan-dtc1b-massive-turbo-definitive.ps1
./scan-dtc1b-working-fixed.ps1
`

### Parámetros del Escaneo
- FilePath: Ruta al archivo DTC1B (por defecto: E:\final AAAA\dtc1b)
- BlockSize: Tamaño del bloque de procesamiento (por defecto: 100MB)
- OutputDir: Directorio de salida (por defecto: extracted-data)

## 📈 Datos Extraídos

El sistema extrae automáticamente:
- **Balances**: Montos en EUR, USD, GBP
- **Transacciones**: Historial completo de movimientos
- **Cuentas**: Números de cuenta bancaria
- **Tarjetas**: Números de tarjeta de crédito
- **Usuarios**: Información de usuarios

## 🔒 Seguridad

- Datos encriptados en tránsito
- Autenticación JWT
- Validación de entrada
- Logs de auditoría

## 📝 API Endpoints

### Escaneo Masivo
- POST /api/full-scan/start - Iniciar escaneo
- GET /api/full-scan/status - Estado del escaneo
- POST /api/full-scan/stop - Detener escaneo

### Datos Financieros
- GET /api/v1/accounts - Lista de cuentas
- GET /api/v1/ledger/transactions - Transacciones
- GET /api/v1/ledger/balances - Balances

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (git checkout -b feature/AmazingFeature)
3. Commit tus cambios (git commit -m 'Add some AmazingFeature')
4. Push a la rama (git push origin feature/AmazingFeature)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver LICENSE para más detalles.

## 🆘 Soporte

Para soporte técnico o preguntas:
- Crear un issue en GitHub
- Revisar la documentación en /docs
- Consultar los logs del sistema

## 🎯 Roadmap

- [ ] Autenticación de usuarios
- [ ] Reportes avanzados
- [ ] Integración con más exchanges
- [ ] API REST completa
- [ ] Aplicación móvil

---

**Desarrollado con ❤️ para el análisis de datos bancarios DTC1B**
