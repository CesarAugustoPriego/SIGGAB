# Prueba Manual Auth (Frontend)

Fecha sugerida de ejecucion: 2026-04-01

## Precondiciones
1. Backend arriba en `http://localhost:3000`.
2. Frontend arriba con `npm run dev`.
3. Usuario de prueba disponible:
   - `username`: `admin`
   - `password`: `SiggabAdmin2026!`

## Casos a ejecutar

1. Login exitoso
- Ir a `#/auth/login`.
- Capturar credenciales validas.
- Esperar redireccion a `#/app`.
- Resultado esperado: se ve tarjeta de sesion activa con nombre y rol.

2. Guardas publicas -> protegida
- Con sesion activa, navegar manualmente a `#/auth/login` o `#/auth/register`.
- Resultado esperado: redireccion automatica a `#/app`.

3. Guardas protegida -> publica
- Cerrar sesion en `#/app`.
- Intentar abrir `#/app` sin token.
- Resultado esperado: redireccion automatica a `#/auth/login`.

4. Error 401 por credenciales invalidas
- En `#/auth/login`, escribir password incorrecta.
- Resultado esperado: banner con mensaje de credenciales invalidas/sesion expirada.

5. Error 423 por bloqueo temporal
- Intentar login fallido 5 veces consecutivas con el mismo usuario.
- Resultado esperado: mensaje de cuenta bloqueada temporalmente (423).

6. Refresh de token (flujo de sesion expirada)
- Con sesion activa, esperar expiracion de access token o forzar un `401` desde backend.
- Ejecutar accion `Probar /auth/me`.
- Resultado esperado:
  - si refresh valido: perfil se refresca y sesion sigue activa.
  - si refresh invalido/revocado: sesion se cierra y redirige a `#/auth/login`.

7. Error 403 por permisos
- Iniciar sesion con un usuario sin permisos de un endpoint restringido.
- Consumir endpoint restringido desde la UI o consola.
- Resultado esperado: mensaje de rol sin permisos.

## Registro de ejecucion
- Marcar cada caso como `OK` o `FAIL`.
- Si hay `FAIL`, registrar:
  - ruta
  - pasos reproducibles
  - mensaje mostrado
  - captura de pantalla
