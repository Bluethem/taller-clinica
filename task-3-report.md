# HU10 Task 3 — Autenticación local y sesiones

## Final-review fix

- `LocalStrategy` habilita `passReqToCallback` y propaga la IP real de la petición a `SeguridadService.validateUser`, preservando la dirección del cliente en `auditoria.bitacora`.
- El cierre de sesión elimina `sigc.sid` con las mismas opciones usadas al crear la cookie de sesión.
- Se eliminó `LoginDto`, que no tenía consumidores.
- Se añadió cobertura unitaria para verificar que una IP no predeterminada llega a `validateUser`.
