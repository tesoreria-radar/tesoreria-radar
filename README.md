# Radar Autónomo de Tesorería — V7

V7 incorpora el **Cash Calendar fiscal-operativo** y deja preparada la integración con la agenda personalizada de ARCA.

## Objetivo
Cruzar diariamente:
- BCRA y normativa
- Mercado cambiario
- ARCA / vencimientos fiscales
- Real Estate
- Vaca Muerta / Energía / RIGI
- Calendario de informes BCRA
- Feriados y días operativos

para producir un reporte de Tesorería con alertas y horizonte de caja de 3/7/15/30 días.

## Regla clave ARCA
La agenda pública de ARCA es una fuente de referencia. La agenda específica por contribuyente vive en Sistema de Cuentas Tributarias y requiere acceso autenticado. La V7 no intenta almacenar credenciales ni automatizar un login inseguro: deja un conector explícito para incorporar datos autenticados de la empresa.

## Variables
- ARCA_CUIT_ENDING=0..9
- ARCA_OBLIGATIONS=IVA,Ganancias,Seguridad Social
- DATABASE_URL=...
- CRON_SECRET=...
- ALERT_WEBHOOK_URL=...

## Endpoints
- GET /api/arca/vencimientos
- GET /api/cash-calendar?days=30
- POST /api/report
- POST /api/alerts

## Flujo
1. Captura fuentes oficiales.
2. Normaliza fechas y moneda.
3. Deduplica.
4. Detecta cambios de fecha.
5. Calcula días hábiles.
6. Clasifica impacto.
7. Consolida obligaciones por 3/7/15/30 días.
8. Genera reporte y alertas.

## Próxima integración
Conectar un proveedor autenticado para la agenda personalizada de Sistema de Cuentas Tributarias y, opcionalmente, los importes/obligaciones reales de la empresa.


## V8 — actualización automática cada 5 minutos

La V8 agrega:
- `/api/cron/refresh`: pipeline de actualización.
- `/api/status`: estado y hora del servidor.
- `vercel.json`: cron `*/5 * * * *`.
- Política de frescura de 5 minutos.
- Timestamp por fuente para saber si un dato está actualizado.

### Importante sobre Vercel
La ejecución de Cron con una frecuencia superior a una vez por día requiere un plan de Vercel que permita esa frecuencia. La cuenta Hobby no es adecuada para este cron de 5 minutos; para producción se debe usar Vercel Pro o un scheduler externo. La aplicación queda desacoplada del scheduler para poder usar cualquiera de los dos.

### Estrategia recomendada
- Scheduler: cada 5 minutos.
- Ingesta: sólo fuentes que hayan cambiado o estén vencidas.
- Cache: 5 minutos.
- IA: no ejecutar cada 5 minutos sobre todo el universo; sólo cuando haya novedades nuevas.
- Reporte diario: 08:00.
- Alertas: inmediatas ante eventos de alto impacto.


## V9 — 100% Web

La aplicación pasa a ser una interfaz web completa:
- Dashboard de Tesorería.
- Actualización automática del navegador cada 5 minutos.
- Estado del sistema y timestamp.
- Módulos BCRA, dólar, ARCA, Cash Calendar, Real Estate y Vaca Muerta.
- Preparada para autenticación y roles.
- Compatible con despliegue en Vercel.

### Arquitectura
Browser -> Next.js Web App -> API Routes -> DB -> fuentes externas.

El navegador nunca debe contener credenciales de ARCA, BCRA, DB ni secretos de cron.


## V10 — Producción

Se agrega:
- `/api/health` para heartbeat y health check.
- Umbral de dato stale de 10 minutos.
- Contrato de variables de entorno.
- Política de seguridad.
- Reglas de calidad de datos.
- Diseño para autenticación antes de exponer información personalizada.


## V11 — Production readiness

La aplicación queda preparada para pasar a producción, pero requiere que se cree/provisione el proyecto Vercel y se conecten las fuentes y base de datos reales. El entorno Vercel disponible actualmente tiene el equipo `NLK Teso Agent` pero ningún proyecto creado.


## V12 — 100% Web

La aplicación se consolida como una plataforma web:
- navegación por módulos
- dashboard operativo
- PWA manifest
- responsive por arquitectura
- actualización automática
- backend separado del navegador
- sin instalación local para el usuario final
