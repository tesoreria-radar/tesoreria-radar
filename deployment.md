# V11 — Despliegue web de producción

## Estado del entorno Vercel
Equipo detectado: `NLK Teso Agent`
Actualmente no hay proyectos Vercel creados en ese equipo.

## Requisitos para producción
1. Crear proyecto Vercel.
2. Conectar este repositorio/proyecto.
3. Configurar `DATABASE_URL`.
4. Configurar `CRON_SECRET`.
5. Configurar autenticación.
6. Configurar los adaptadores de fuentes.
7. Configurar scheduler cada 5 minutos.
8. Ejecutar smoke tests.
9. Promover a Production.

## No desplegar como producción hasta conectar fuentes reales
Los endpoints de esta versión contienen límites de integración explícitos y no deben presentarse como datos reales si el adaptador no está conectado.

## Criterios de aceptación
- Dashboard accesible por HTTPS.
- Login funcional.
- Refresh cada 5 minutos.
- Heartbeat <10 min.
- Datos con source/observed_at.
- Persistencia histórica.
- Alertas críticas.
- Reporte diario.
- ARCA público funcionando.
- ARCA personalizado sólo mediante acceso autorizado.
