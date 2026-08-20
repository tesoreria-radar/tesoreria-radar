# Integración ARCA

## Dos capas

### Capa pública
Usar `https://www.arca.gob.ar/vencimientos/` y micrositios de cada impuesto para construir un calendario general.

### Capa personalizada
ARCA informa que Sistema de Cuentas Tributarias ofrece una agenda específica para los impuestos del contribuyente y requiere clave fiscal nivel 3 o superior.

La aplicación debe integrar esta segunda capa mediante un mecanismo autorizado (por ejemplo, un conector empresarial o una exportación autorizada). No se deben guardar contraseñas de ARCA en el proyecto.

## Eventos que deben disparar alerta
- Nuevo vencimiento.
- Cambio de fecha.
- Prórroga.
- Nuevo régimen.
- Vencimiento dentro de 7 días.
- Vencimiento dentro de 2 días.
- Obligación sin importe todavía conocido.

## Regla de presentación vs pago
Guardar ambos vencimientos por separado cuando ARCA los publique. Nunca asumir que presentación y pago tienen la misma fecha.
