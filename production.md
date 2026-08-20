# V10 — Producción

## Variables obligatorias
- DATABASE_URL
- CRON_SECRET
- NEXTAUTH_SECRET (cuando se habilite autenticación)
- ALERT_WEBHOOK_URL (opcional)

## Seguridad
- Secretos únicamente en variables de entorno del servidor.
- Nunca enviar credenciales de ARCA al browser.
- Autenticación antes de exponer información personalizada.
- Separar datos públicos de ARCA de datos de Sistema de Cuentas Tributarias.

## Operación
- Refresh de fuentes: cada 5 minutos.
- Heartbeat: cada ciclo.
- Stale threshold: 10 minutos.
- Reporte ejecutivo: 08:00.
- Alertas críticas: inmediatas.
- Histórico: persistente.

## Regla de calidad
Cada dato debe guardar:
- fuente
- URL
- observed_at
- effective_at cuando corresponda
- fecha de publicación
- hash/identificador para deduplicación

## Criterio de falla
Si una fuente falla:
- conservar último dato válido
- marcarlo como stale
- registrar el error
- no presentar el dato como actual
- generar alerta si supera 10 minutos
