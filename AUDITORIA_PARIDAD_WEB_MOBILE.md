# Auditoria de paridad Web vs Mobile - SIGGAB

Fecha de auditoria: 2026-04-23  
Alcance: auditoria estatica de codigo entre `Frontend`, `Mobile` y `Backend`.  
Nota de alcance: el frontend web revisado es React con Vite, no Next.js. Se audito igualmente como la aplicacion web del ecosistema.

## Resumen ejecutivo

Se identificaron **43 hallazgos accionables** de consistencia cross-platform y **7 diferencias justificadas por plataforma** que no deben tratarse como deuda de paridad.

| Fase | Critico | Alto | Medio | Bajo | Total |
|---|---:|---:|---:|---:|---:|
| Fase 1 - Terminologia y etiquetas UI | 0 | 2 | 5 | 1 | 8 |
| Fase 2 - Paridad funcional | 0 | 0 | 4 | 0 | 4 |
| Fase 3 - Parametros y formularios | 0 | 5 | 3 | 1 | 9 |
| Fase 4 - Navegacion y flujos | 1 | 2 | 2 | 0 | 5 |
| Fase 5 - Visual y diseno | 0 | 1 | 3 | 1 | 5 |
| Fase 6 - Estados y errores | 1 | 1 | 4 | 0 | 6 |
| Fase 7 - Arquitectura | 1 | 3 | 1 | 1 | 6 |
| **Total** | **3** | **14** | **22** | **4** | **43** |

## Matriz de paridad

| Modulo / feature | Web | Mobile | Estado |
|---|---|---|---|
| Login / sesion | Login, refresh, logout, `me`; usuario/password prellenados | Login, refresh, logout, `me`; campos vacios | 🔄 Diferente |
| Cambio de contrasena propio | ❌ Ausente como flujo dedicado | ✅ Perfil con cambio de contrasena | 🔄 Diferente |
| Dashboard administrativo | ✅ Modulo web/back-office dedicado | No aplica como pantalla administrativa | 🖥️ Solo web justificado |
| Home operativo | ⚠️ No aplica como flujo principal | ✅ Home movil resumido por rol | 📱 Solo mobile / operativo |
| Ganado - listado | ✅ Filtros por estado, raza y arete | ⚠️ Busqueda local y filtros por estado | ⚠️ Parcial |
| Ganado - registro/edicion/baja | ✅ Completo | ✅ Completo | ✅ Completo |
| Ganado - escaneo de arete | No aplica con camara nativa; busqueda manual/lector externo | ✅ Camara y entrada manual | 📱 Solo mobile justificado |
| Ganado - detalle/historial | ⚠️ Modal de historial | ✅ Pantalla con tabs, metricas y acciones | 🔄 Diferente |
| Sanitario - eventos | ✅ CRUD, aprobar/rechazar | ✅ CRUD, aprobar/rechazar | ⚠️ Parcial por validaciones y copy |
| Sanitario - calendario | ✅ Programacion, filtros, alertas configurables | ✅ Calendario visual y programacion | 🔄 Diferente |
| Productivo - lotes | ✅ Gestion/validacion back-office | ⚠️ Solo selector para captura | 🖥️ Gestion web / captura mobile |
| Productivo - peso | ✅ Crear, editar, validar, filtrar | ⚠️ Captura/listado operativo | 🖥️ Validacion web / captura mobile |
| Productivo - leche | ✅ Crear, editar, validar, filtrar | ⚠️ Captura/listado operativo | 🖥️ Validacion web / captura mobile |
| Productivo - reproductivo | ✅ Crear, editar, validar, filtrar | ⚠️ Captura/listado operativo | 🖥️ Validacion web / captura mobile |
| Inventario - insumos/tipos | ✅ CRUD y activacion | ✅ Consulta para movimientos | 🖥️ CRUD solo web justificado |
| Inventario - movimientos | ✅ Crear y listar con validacion de stock | ⚠️ Crear/listar sin validacion local equivalente | ⚠️ Parcial |
| Inventario - solicitudes | ✅ Back-office | No aplica si se mantiene inventario mobile ligero | 🖥️ Solo web justificado |
| Inventario - compras | ✅ Back-office | No aplica si se mantiene inventario mobile ligero | 🖥️ Solo web justificado |
| Reportes avanzados | ✅ JSON, filtros, PDF/CSV, comparativo | ⚠️ Descarga rapida PDF | 🖥️ Avanzado web / consulta mobile |
| Aprobaciones | ✅ Back-office y modulos completos | ⚠️ Solo aprobaciones operativas seleccionadas | 🔄 Alcance a formalizar |
| Usuarios | ✅ Administracion de usuarios y roles | No aplica en mobile operativo | 🖥️ Solo web justificado |
| Auditoria / bitacora | ✅ Modulo web | No aplica en mobile operativo | 🖥️ Solo web justificado |
| Respaldos | ✅ Modulo web | No aplica en mobile operativo | 🖥️ Solo web justificado |
| Push token | No aplica salvo notificaciones web futuras | ✅ `usuarios/me/push-token` | 📱 Solo mobile justificado |

## Top 10 prioridades

1. 🔴 Corregir el Home mobile: si muestra metricas operativas, debe consultar endpoints autorizados y no devolver ceros silenciosos.
2. 🔴 Centralizar permisos/roles en una fuente compartida o generada desde backend; ya hay divergencias entre web, mobile y API.
3. 🟠 Agregar guards por rol en rutas mobile, no solo validaciones dentro de algunas pantallas.
4. 🟠 Unificar validaciones sanitarias y de formularios que si existen en ambas plataformas.
5. 🟠 Resolver el login web con credenciales prellenadas antes de produccion.
6. 🟠 Formalizar el alcance mobile: captura operativa, escaneo, movimientos, consulta rapida y perfil.
7. 🟠 Formalizar el alcance web: administracion, auditoria, respaldos, catalogos, dashboard y reportes avanzados.
8. 🟠 Corregir errores silenciosos en aprobaciones/reportes mobile para distinguir "sin datos" de "fallo de consulta".
9. 🟠 Alinear formularios productivos mobile con su alcance real: captura/listado, no administracion pesada.
10. 🟡 Definir tokens visuales compartidos para colores de estado, botones, cards, iconos y mensajes.

## Supuestos de auditoria

- `Backend` es la fuente de verdad funcional.
- `Frontend` representa la aplicacion web, aunque no sea Next.js.
- `Mobile` representa la aplicacion React Native/Expo.
- La paridad esperada no significa que cada plataforma deba tener identico alcance. La auditoria separa brechas reales de diferencias justificadas por contexto de uso.
- Web se considera la plataforma principal para administracion pesada: usuarios, auditoria, respaldos, dashboard administrativo, catalogos, compras, reportes avanzados y validaciones masivas.
- Mobile se considera la plataforma principal para operacion en campo: captura rapida, consulta operativa, escaneo con camara, movimientos simples, alertas, perfil y notificaciones push.
- No se ejecuto una auditoria visual con capturas; la fase visual se basa en codigo, componentes y estilos.

## Diferencias justificadas por plataforma

Estas diferencias no deben convertirse automaticamente en tareas de paridad:

- **Escaneo de arete con camara:** debe mantenerse como ventaja mobile. En web basta busqueda manual o soporte para lector externo/USB si se requiere.
- **Dashboard administrativo:** debe mantenerse web/back-office. Mobile solo necesita Home operativo resumido.
- **Usuarios, auditoria y respaldos:** por seguridad y comodidad operativa, son modulos web.
- **Catalogos de inventario, creacion de insumos, compras y mantenimiento pesado:** deben seguir en web si la operacion mobile se define como consulta/movimientos.
- **Reportes avanzados, comparativos y CSV:** web debe ser la experiencia completa; mobile puede ofrecer descarga rapida o consulta ligera.
- **Push token/notificaciones:** es una capacidad naturalmente mobile. Web solo debe implementarla si luego se definen notificaciones web.
- **Validaciones/aprobaciones masivas:** web es el canal natural; mobile solo deberia incluir aprobaciones puntuales si aportan valor en campo.

---

# Hallazgos por fase

## Fase 1 - Paridad de terminologia y etiquetas UI

### [FASE 1] Login prellenado - [SEVERIDAD: 🟠 Alto]
**Descripcion:** La web inicia el login con credenciales reales por defecto, mientras mobile inicia vacio.  
**Plataforma afectada:** Web.  
**Ubicacion:** `Frontend/src/features/auth/components/login-view.tsx`; `Mobile/src/features/auth/screens/login-screen.tsx`.  
**Comportamiento actual:** Web precarga `admin` y una contrasena; mobile exige captura manual.  
**Comportamiento esperado:** Ninguna plataforma debe mostrar credenciales reales en UI de produccion.  
**Accion recomendada:** Vaciar defaults web y mover credenciales demo, si existen, a un entorno seed/documentado no visible.

### [FASE 1] Acentos y redaccion de autenticacion - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Hay diferencias entre `Contrasena`, `Contraseña`, `Iniciar sesion`, `Iniciar sesión`, `Conexion` y `Conexión`.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** Pantallas de login y auth context en `Frontend/src/features/auth` y `Mobile/src/features/auth`.  
**Comportamiento actual:** Cada plataforma define textos propios.  
**Comportamiento esperado:** Usar una misma guia de microcopy en espanol.  
**Accion recomendada:** Crear catalogo compartido de textos de auth y normalizar acentos/mayusculas.

### [FASE 1] Registro de ganado con nombres de accion distintos - [SEVERIDAD: 🟡 Medio]
**Descripcion:** La misma accion se presenta como `Registrar ejemplar`/`Guardar ejemplar` en web y `Registrar`/`Guardar` en mobile.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** `Frontend/src/features/ganado/components/ganado-admin-page.tsx`; `Mobile/src/features/ganado/screens/ganado-register-screen.tsx`.  
**Comportamiento actual:** Mobile usa copy mas generico.  
**Comportamiento esperado:** Mantener una accion identificable: `Registrar ejemplar` y `Guardar ejemplar`, o una variante aprobada.  
**Accion recomendada:** Unificar titulos y CTA del flujo de alta de ganado.

### [FASE 1] Busqueda y escaneo de arete usan etiquetas diferentes - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Web habla de `Busqueda por arete`, `Numero de arete` y busqueda exacta/parcial; mobile usa `Buscar arete...`, `Escanear arete` y captura manual.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** `ganado-admin-page.tsx`; `ganado-list-screen.tsx`; `ganado-scan-screen.tsx`.  
**Comportamiento actual:** El usuario ve nombres diferentes para localizar un mismo animal.  
**Comportamiento esperado:** Terminologia unica: `Arete SINIIGA`, `Buscar por arete`, `Escanear arete`.  
**Accion recomendada:** Crear convencion de labels para identificadores de animal.

### [FASE 1] Sanitario usa CTAs inconsistentes - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Web usa `Registrar evento`, `Programar evento`; mobile usa `Guardar Registro`, `Actualizar Registro`, `Guardar programacion`.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** `Frontend/src/features/sanitario/components/sanitario-admin-page.tsx`; `Mobile/src/features/sanitario/screens`.  
**Comportamiento actual:** Los botones no describen la misma accion con el mismo verbo.  
**Comportamiento esperado:** Misma taxonomia: registrar, actualizar, programar, completar, cancelar.  
**Accion recomendada:** Unificar botones y titulos sanitarios.

### [FASE 1] Estado `COMPLETADO` aparece como `REALIZADO` en mobile - [SEVERIDAD: 🟠 Alto]
**Descripcion:** Mobile transforma `COMPLETADO` a `REALIZADO`, mientras web mantiene `COMPLETADO`.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** `Mobile/src/features/sanitario/sanitario-utils.ts`; web en `Frontend/src/features/sanitario/sanitario-utils.ts`.  
**Comportamiento actual:** Un mismo estado del backend se muestra con dos nombres.  
**Comportamiento esperado:** Un unico label de estado en todas las plataformas.  
**Accion recomendada:** Elegir `Completado` o `Realizado` como label oficial y aplicarlo a web/mobile/reportes.

### [FASE 1] Productivo usa emojis como parte de labels - [SEVERIDAD: 🟢 Bajo]
**Descripcion:** Mobile usa etiquetas como `⚖️ Peso`, `🥛 Leche`, `🐄 Reprod.`, mientras web usa texto administrativo.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** `Mobile/src/features/productivo/screens/productivo-home-screen.tsx`.  
**Comportamiento actual:** Mobile mezcla iconografia emoji con copy funcional.  
**Comportamiento esperado:** Iconos consistentes y texto sin abreviaciones ambiguas.  
**Accion recomendada:** Sustituir emojis por iconos del sistema mobile y labels completos.

### [FASE 1] Inventario renombra salida como gasto - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Mobile muestra `Salida (Gasto)` y web/backend manejan `SALIDA`.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** `Mobile/src/features/inventario/screens/registro-movimiento-screen.tsx`; `Frontend/src/features/inventario/components/inventario-admin-page.tsx`.  
**Comportamiento actual:** Mobile introduce una interpretacion contable no presente en web/API.  
**Comportamiento esperado:** `Entrada` y `Salida` como terminos base; si se requiere gasto, agregar campo o subtipo.  
**Accion recomendada:** Cambiar label mobile o formalizar `gasto` en modelo/API.

## Fase 2 - Paridad funcional

En esta fase ya se excluyen de la deuda de paridad las funciones deliberadamente web-only o mobile-only: escaneo con camara, dashboard administrativo, usuarios, auditoria, respaldos, catalogos de inventario, compras y reportes avanzados.

### [FASE 2] Alcance mobile no esta formalizado en permisos y navegacion - [SEVERIDAD: 🟡 Medio]
**Descripcion:** El codigo mobile declara modulos de administracion pesada (`usuarios`, `auditoria`, `respaldos`) aunque el alcance deseado es operativo/campo.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** `Mobile/src/features/auth/role-permissions.ts`; `Mobile/src/shared/components/nav-drawer.tsx`; `Mobile/app/(app)/_layout.tsx`.  
**Comportamiento actual:** El catalogo interno mezcla modulos mobile y web-only.  
**Comportamiento esperado:** Mobile debe declarar solo modulos operativos o marcar explicitamente los web-only como no navegables.  
**Accion recomendada:** Separar `ALL_MODULES` en `mobileModules` y `webOnlyModules`, o agregar `platform: 'web' | 'mobile' | 'both'`.

### [FASE 2] Reportes mobile deben presentarse como consulta rapida, no como paridad completa - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Web conserva reportes avanzados; mobile descarga reportes estaticos. Eso puede ser correcto, pero debe ser explicito en UX/codigo.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** `Frontend/src/features/reportes/reportes-api.ts`; `Mobile/src/features/reportes/screens/reportes-home-screen.tsx`; `Mobile/src/lib/download-service.ts`.  
**Comportamiento actual:** Mobile no deja claro si la ausencia de filtros/CSV/comparativo es decision de producto o funcionalidad pendiente.  
**Comportamiento esperado:** Reportes avanzados web-only y reportes mobile como descarga rapida/consulta ligera.  
**Accion recomendada:** Renombrar la seccion mobile como reportes rapidos y documentar que filtros avanzados viven en web.

### [FASE 2] Aprobaciones mobile mezclan alcance operativo y back-office - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Mobile agrega algunas aprobaciones, pero no define si las aprobaciones masivas son web-only.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** `Mobile/src/features/aprobaciones/aprobaciones-api.ts`; modulos web de sanitario/productivo/inventario.  
**Comportamiento actual:** La app mobile puede parecer incompleta frente a web, cuando parte de esa diferencia puede ser intencional.  
**Comportamiento esperado:** Mobile debe mostrar solo aprobaciones puntuales autorizadas para campo; web debe mantener aprobaciones masivas/back-office.  
**Accion recomendada:** Definir una lista allowlist de aprobaciones mobile y ocultar/ignorar el resto como web-only.

### [FASE 2] Filtros de ganado no son equivalentes en flujo compartido - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Web filtra por estado, raza y arete; mobile filtra principalmente por estado y busqueda local. Este flujo si existe en ambas plataformas.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** `ganado-admin-page.tsx`; `ganado-list-screen.tsx`; `Mobile/src/features/ganado/ganado-types.ts`.  
**Comportamiento actual:** Mobile no expone filtro de raza equivalente y su tipo de filtros no incluye `arete`.  
**Comportamiento esperado:** Para listado de ganado, mantener los filtros clave aunque el layout sea distinto.  
**Accion recomendada:** Agregar filtro de raza en mobile y alinear `AnimalFilters`.

## Fase 3 - Consistencia de parametros y formularios

### [FASE 3] Validacion sanitaria difiere entre web y mobile - [SEVERIDAD: 🟠 Alto]
**Descripcion:** Mobile valida mas reglas por categoria, dosis/via y fecha de alerta; web valida solo campos base.  
**Plataforma afectada:** Web.  
**Ubicacion:** `Mobile/src/features/sanitario/sanitario-utils.ts`; `Frontend/src/features/sanitario/components/sanitario-admin-page.tsx`.  
**Comportamiento actual:** El mismo evento sanitario puede ser aceptado en web y rechazado en mobile.  
**Comportamiento esperado:** Reglas identicas y preferentemente compartidas desde backend/schema.  
**Accion recomendada:** Extraer validaciones a esquema comun o replicarlas desde backend en ambos clientes.

### [FASE 3] Alertas sanitarias usan ventanas distintas - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Web usa alerta configurable con default de 3 dias; mobile consulta alertas a 30 dias fijos.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** `Frontend/src/features/sanitario/components/sanitario-admin-page.tsx`; `Mobile/src/features/sanitario/screens/calendario-screen.tsx`.  
**Comportamiento actual:** Los usuarios ven conjuntos de alertas distintos.  
**Comportamiento esperado:** Misma ventana default o preferencia configurable por usuario.  
**Accion recomendada:** Unificar default y exponer selector en ambas plataformas.

### [FASE 3] Lotes productivos se filtran distinto - [SEVERIDAD: 🟠 Alto]
**Descripcion:** Mobile carga solo lotes `PENDIENTE` para peso/leche y los llama `activos`; web lista/usa lotes con alcance mas amplio.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** `Mobile/src/features/productivo/screens/registro-peso-screen.tsx`; `registro-leche-screen.tsx`; `Frontend/src/features/productivo/components/productivo-admin-page.tsx`.  
**Comportamiento actual:** Un lote disponible en web puede no aparecer en mobile.  
**Comportamiento esperado:** Criterio unico para lotes capturables, idealmente `APROBADO`/abierto si asi lo define negocio.  
**Accion recomendada:** Definir estado valido de captura y aplicarlo en backend, web y mobile.

### [FASE 3] Productivo mobile usa helper de permisos incorrecto - [SEVERIDAD: 🟠 Alto]
**Descripcion:** `ProductivoHomeScreen` decide acciones de registro con `canCreateAnimal`, no con permiso productivo.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** `Mobile/src/features/productivo/screens/productivo-home-screen.tsx`.  
**Comportamiento actual:** La capacidad de crear animales puede habilitar flujos productivos indebidamente.  
**Comportamiento esperado:** Usar permisos especificos: crear peso, leche, reproductivo y lotes.  
**Accion recomendada:** Crear helpers `canCreatePeso`, `canCreateLeche`, `canCreateReproductivo` y usarlos en UI/rutas.

### [FASE 3] Formularios mobile productivos no tienen guards consistentes - [SEVERIDAD: 🟠 Alto]
**Descripcion:** Registro de peso/leche/movimiento dependen mayormente del backend para rechazar permisos.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** `Mobile/src/features/productivo/screens/registro-peso-screen.tsx`; `registro-leche-screen.tsx`; `Mobile/src/features/inventario/screens/registro-movimiento-screen.tsx`.  
**Comportamiento actual:** Usuarios pueden llegar a pantallas que luego fallan por 403.  
**Comportamiento esperado:** Guard visual y de navegacion antes de mostrar formularios no autorizados.  
**Accion recomendada:** Aplicar guards por rol y ocultar acciones en drawer/home/listas.

### [FASE 3] Umbrales de stock no coinciden - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Web clasifica stock vacio/critico/bajo con umbrales 0/10/50; mobile cuenta bajo stock con `<= 5`.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** `Frontend/src/features/inventario/inventario-utils.ts`; `Mobile/src/features/inventario/screens/inventario-home-screen.tsx`.  
**Comportamiento actual:** La misma existencia puede verse normal en mobile y baja/critica en web.  
**Comportamiento esperado:** Umbrales compartidos por tipo de insumo o configuracion.  
**Accion recomendada:** Centralizar `getStockLevel` y reutilizarlo.

### [FASE 3] Salidas de inventario mobile no validan stock localmente - [SEVERIDAD: 🟠 Alto]
**Descripcion:** Web impide salida mayor al stock disponible antes de enviar; mobile solo envia la solicitud.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** `Frontend/src/features/inventario/components/inventario-admin-page.tsx`; `Mobile/src/features/inventario/screens/registro-movimiento-screen.tsx`.  
**Comportamiento actual:** Mobile permite intentar salidas imposibles y delega el error al servidor.  
**Comportamiento esperado:** Misma validacion local y error preventivo.  
**Accion recomendada:** Consultar stock seleccionado y validar cantidad antes de `createMovimiento`.

### [FASE 3] Reportes mobile no transmiten parametros equivalentes - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Web envia filtros por query y formato; mobile solo agrega `formato=pdf|csv`.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** `Frontend/src/features/reportes/reportes-api.ts`; `Mobile/src/lib/download-service.ts`.  
**Comportamiento actual:** El backend recibe consultas distintas para la misma intencion.  
**Comportamiento esperado:** Igual estructura de filtros y descarga.  
**Accion recomendada:** Portar tipos de filtros web a mobile y serializar query params completos.

### [FASE 3] Tipo mobile de filtros de ganado no incluye `arete` - [SEVERIDAD: 🟢 Bajo]
**Descripcion:** El tipo `AnimalFilters` mobile no refleja todos los filtros web/API.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** `Mobile/src/features/ganado/ganado-types.ts`; `Frontend/src/features/ganado/ganado-types.ts`.  
**Comportamiento actual:** Hay busqueda en UI, pero el contrato typed no esta alineado.  
**Comportamiento esperado:** Tipos homologos entre plataformas.  
**Accion recomendada:** Agregar `arete?: string` y revisar filtros consumidos por API.

## Fase 4 - Navegacion y flujos de usuario

### [FASE 4] Rutas mobile no tienen guards por rol a nivel layout - [SEVERIDAD: 🔴 Critico]
**Descripcion:** El stack mobile valida autenticacion, pero no bloquea rutas por rol de forma centralizada.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** `Mobile/app/(app)/_layout.tsx`; web en `Frontend/src/app/app-shell.tsx`.  
**Comportamiento actual:** Web filtra rutas por rol; mobile puede exponer rutas directas si el usuario navega a ellas.  
**Comportamiento esperado:** Guards equivalentes por rol y modulo.  
**Accion recomendada:** Crear mapa de rutas mobile con permisos y redirigir a Home/403 antes de montar pantallas.

### [FASE 4] Navegacion mobile omite modulos declarados - [SEVERIDAD: 🟠 Alto]
**Descripcion:** `role-permissions.ts` declara auditoria, usuarios y respaldos; el drawer/home no los exponen.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** `Mobile/src/features/auth/role-permissions.ts`; `Mobile/src/shared/components/nav-drawer.tsx`; `Mobile/src/features/home`.  
**Comportamiento actual:** El catalogo de permisos y la navegacion no coinciden.  
**Comportamiento esperado:** La navegacion debe generarse desde la misma fuente de modulos visibles.  
**Accion recomendada:** Usar `getVisibleModulesForRole` para construir drawer/home o reducir `ALL_MODULES`.

### [FASE 4] Landing post-login difiere por plataforma - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Web manda admin a usuarios por defecto; mobile manda a Home.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** `Frontend/src/app/app-shell.tsx`; `Mobile/app/(app)/_layout.tsx`.  
**Comportamiento actual:** El primer destino tras login cambia de manera no documentada.  
**Comportamiento esperado:** Definir destino por rol consistente.  
**Accion recomendada:** Formalizar tabla `defaultRouteByRole` y compartirla conceptualmente.

### [FASE 4] Acciones guardadas redirigen distinto - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Web suele permanecer en la pagina y refrescar listas; mobile muestra alerta y usa `router.back()`.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** Formularios de ganado/productivo/inventario en web y mobile.  
**Comportamiento actual:** La confirmacion y siguiente paso post-accion varian.  
**Comportamiento esperado:** Flujo post-guardado definido por modulo: permanecer, detalle, lista o siguiente captura.  
**Accion recomendada:** Crear reglas de navegacion post-accion y aplicarlas a ambos clientes.

### [FASE 4] Aprobaciones por rol no separan claramente tipos de entidad - [SEVERIDAD: 🟠 Alto]
**Descripcion:** Mobile agrega items heterogeneos, pero no refleja todos los permisos especificos de aprobacion.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** `Mobile/src/features/aprobaciones/aprobaciones-api.ts`; `Mobile/src/features/auth/role-permissions.ts`.  
**Comportamiento actual:** La UI puede mezclar aprobaciones que el backend no permite al rol actual o esconder las que si.  
**Comportamiento esperado:** Cola filtrada por `canApproveSanitario`, `canApproveProductivo`, `canApproveSolicitudes`.  
**Accion recomendada:** Separar permisos y queries por entidad aprobable.

## Fase 5 - Consistencia visual y de diseno

### [FASE 5] No hay tokens visuales compartidos - [SEVERIDAD: 🟠 Alto]
**Descripcion:** Web y mobile hardcodean colores, radios, espaciados y jerarquias visuales en archivos separados.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** `Frontend/src/style.css`; `Frontend/src/premium-design.css`; pantallas en `Mobile/src/features/*/screens`.  
**Comportamiento actual:** Cada plataforma evoluciona su propio design system.  
**Comportamiento esperado:** Tokens comunes para color, tipografia, estado, spacing y elevacion.  
**Accion recomendada:** Crear `design-tokens` compartido y mapearlo a CSS variables/web y theme RN.

### [FASE 5] Colores de estado no son consistentes - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Los colores de `APROBADO`, `RECHAZADO`, `PENDIENTE`, stock y estados sanitarios difieren entre helpers.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** Utilidades de estado en `Frontend/src/features/*/*-utils.ts` y `Mobile/src/features/*/*-utils.ts`.  
**Comportamiento actual:** La misma semantica puede verse con tonos diferentes.  
**Comportamiento esperado:** Paleta semantica compartida.  
**Accion recomendada:** Centralizar `statusColors` y etiquetas.

### [FASE 5] Iconografia mezcla librerias y emojis - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Web usa principalmente iconos React/lucide; mobile combina Expo icons y emojis en tabs.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** Nav web, Home/mobile, productivo/inventario mobile.  
**Comportamiento actual:** Acciones iguales no siempre tienen icono equivalente.  
**Comportamiento esperado:** Set iconografico homologado por accion.  
**Accion recomendada:** Crear mapa de iconos por accion y eliminar emojis de controles funcionales.

### [FASE 5] Densidad y radios de cards divergen - [SEVERIDAD: 🟢 Bajo]
**Descripcion:** Mobile usa cards con radios grandes y layouts mas expresivos; web usa paneles/tablas administrativas.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** CSS web y estilos inline/StyleSheet mobile.  
**Comportamiento actual:** La diferencia puede ser aceptable, pero no parece provenir de tokens comunes.  
**Comportamiento esperado:** Diferencia adaptativa, no accidental.  
**Accion recomendada:** Definir reglas por breakpoint/plataforma para cards, tablas y listas.

### [FASE 5] Feedback visual no esta homologado - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Web usa banners/mensajes inline; mobile usa alerts, loaders y estados por pantalla.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** Formularios y listas en todos los modulos.  
**Comportamiento actual:** Loading, exito y error se sienten distintos por plataforma.  
**Comportamiento esperado:** Patrones equivalentes: toast/snackbar, inline error, empty state y skeleton.  
**Accion recomendada:** Crear componentes de feedback compartidos conceptualmente.

## Fase 6 - Estados y manejo de errores

### [FASE 6] Home mobile oculta errores de permisos y muestra ceros - [SEVERIDAD: 🔴 Critico]
**Descripcion:** Mobile llama endpoints de dashboard no permitidos para algunos roles, captura errores y devuelve 0.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** `Mobile/src/lib/home-dashboard-api.ts`; backend `Backend/src/routes/dashboard.routes.js`.  
**Comportamiento actual:** Veterinario/Produccion/Campo pueden ver metricas en 0 por 403 oculto, no por datos reales.  
**Comportamiento esperado:** Consultar endpoints autorizados o mostrar estado de no disponible/error.  
**Accion recomendada:** Rehacer `fetchHomeStats` por rol usando permisos backend reales y no silenciar 403.

### [FASE 6] Aprobaciones mobile silencian errores por fuente - [SEVERIDAD: 🟠 Alto]
**Descripcion:** El agregador captura errores y retorna `[]`, ocultando fallas de red/permisos.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** `Mobile/src/features/aprobaciones/aprobaciones-api.ts`.  
**Comportamiento actual:** Una cola vacia puede significar "sin pendientes" o "fallo la consulta".  
**Comportamiento esperado:** Mostrar error parcial por modulo y no falsear ausencia de pendientes.  
**Accion recomendada:** Retornar estado `{items, error}` por fuente y mostrar avisos.

### [FASE 6] Errores de validacion tienen redaccion distinta - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Mensajes como fecha invalida, cantidad requerida, sesion expirada y permisos insuficientes varian por cliente.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** Utilidades de validacion y API clients en `Frontend/src` y `Mobile/src`.  
**Comportamiento actual:** El mismo fallo no se explica igual.  
**Comportamiento esperado:** Catalogo comun de errores por codigo.  
**Accion recomendada:** Estandarizar mensajes en backend/API y mapearlos en ambos clientes.

### [FASE 6] Empty states no tienen el mismo nivel de informacion - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Mobile muestra mensajes especificos como `Crea uno desde el panel web`; web no refleja la dependencia inversa.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** Pantallas productivas mobile.  
**Comportamiento actual:** Mobile asume que ciertas acciones solo se resuelven en web.  
**Comportamiento esperado:** Empty states coherentes y no dependientes de una plataforma salvo decision de producto.  
**Accion recomendada:** Reescribir empty states segun roadmap funcional real.

### [FASE 6] Descargas mobile tienen manejo de error separado - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Mobile implementa descarga/compartir con fetch custom; web usa cliente de reportes con nombres y formatos.  
**Plataforma afectada:** Mobile.  
**Ubicacion:** `Mobile/src/lib/download-service.ts`; `Frontend/src/features/reportes/reportes-api.ts`.  
**Comportamiento actual:** Errores, nombres de archivo y queries se manejan distinto.  
**Comportamiento esperado:** Misma convencion de descarga, errores y formatos.  
**Accion recomendada:** Crear una capa de report download homologada.

### [FASE 6] Sesion expirada se maneja parecido pero no se comunica igual - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Ambos clientes refrescan token y limpian sesion, pero los mensajes/redirects y storage difieren.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** `Frontend/src/lib/http-client.ts`; `Mobile/src/lib/http-client.ts`; auth contexts.  
**Comportamiento actual:** El usuario puede recibir feedback distinto ante el mismo 401.  
**Comportamiento esperado:** Politica comun para token invalido, refresh fallido y logout forzado.  
**Accion recomendada:** Documentar flujo de sesion y unificar mensajes.

## Fase 7 - Errores estructurales y arquitectura

### [FASE 7] Permisos y roles estan duplicados y ya divergieron - [SEVERIDAD: 🔴 Critico]
**Descripcion:** Backend, web y mobile mantienen reglas de rol independientes. Hay diferencias en permisos como crear animales/productivo.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** `Backend/src/middlewares/role.middleware.js`; `Frontend/src/features/*/*-utils.ts`; `Mobile/src/features/auth/role-permissions.ts`.  
**Comportamiento actual:** La UI puede habilitar u ocultar acciones que el backend decide de otra forma.  
**Comportamiento esperado:** Una fuente de verdad compartida o generada desde backend.  
**Accion recomendada:** Generar permisos frontend desde un manifiesto backend versionado.

### [FASE 7] Clientes API y tipos de dominio estan duplicados - [SEVERIDAD: 🟠 Alto]
**Descripcion:** Web y mobile mantienen manualmente clientes HTTP, endpoints y tipos similares.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** `Frontend/src/features/*/*-api.ts`; `Mobile/src/features/*/*-api.ts`; tipos por modulo.  
**Comportamiento actual:** Las capacidades se desalinean con facilidad, como reportes, productivo e inventario.  
**Comportamiento esperado:** Cliente generado o paquete compartido de contratos.  
**Accion recomendada:** Publicar OpenAPI/Swagger o generar TS clients desde schemas backend.

### [FASE 7] Validaciones de negocio viven en frontends y no estan sincronizadas - [SEVERIDAD: 🟠 Alto]
**Descripcion:** Ganado esta bastante alineado, pero sanitario/productivo/inventario ya tienen diferencias.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** Utils de validacion en `Frontend/src/features` y `Mobile/src/features`; schemas backend.  
**Comportamiento actual:** Los clientes son fuentes de verdad parciales.  
**Comportamiento esperado:** Backend valida todo y frontends consumen schemas o reglas generadas.  
**Accion recomendada:** Exponer schemas Zod/JSON Schema y generar validadores/clientes.

### [FASE 7] Flujos de aprobacion no estan modelados como dominio comun - [SEVERIDAD: 🟠 Alto]
**Descripcion:** Web reparte aprobaciones dentro de modulos; mobile agrega parcialmente una bandeja.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** `Frontend/src/features/aprobaciones`; modulos productivo/inventario/sanitario; `Mobile/src/features/aprobaciones`.  
**Comportamiento actual:** No hay contrato unico de "pendientes aprobables".  
**Comportamiento esperado:** API o servicio agregado de aprobaciones por rol.  
**Accion recomendada:** Crear endpoint backend `/aprobaciones/pendientes` y acciones tipadas por entidad.

### [FASE 7] Versiones base de React difieren significativamente - [SEVERIDAD: 🟡 Medio]
**Descripcion:** Web usa React 18 y mobile React 19/Expo 54. No es bug directo, pero afecta librerias compartibles y comportamiento concurrente.  
**Plataforma afectada:** Ambas.  
**Ubicacion:** `Frontend/package.json`; `Mobile/package.json`.  
**Comportamiento actual:** Las bases evolucionan en ritmos distintos.  
**Comportamiento esperado:** Compatibilidad planeada para paquetes compartidos.  
**Accion recomendada:** Antes de extraer librerias compartidas, definir matriz de compatibilidad React/TS.

### [FASE 7] El supuesto tecnico de Next.js no coincide con el repo - [SEVERIDAD: 🟢 Bajo]
**Descripcion:** La solicitud menciona React/Next.js, pero la web es Vite React.  
**Plataforma afectada:** Web.  
**Ubicacion:** `Frontend/package.json`; estructura `Frontend/src`.  
**Comportamiento actual:** No hay rutas Next/App Router; hay shell SPA con rutas internas.  
**Comportamiento esperado:** Documentacion tecnica actualizada.  
**Accion recomendada:** Actualizar README/arquitectura para evitar auditorias o decisiones basadas en framework incorrecto.

## Roadmap sugerido

### 🟢 Quick wins - menos de 1 dia

- Quitar credenciales prellenadas del login web.
- Unificar copy de login, ganado, sanitario, productivo e inventario.
- Cambiar label mobile `REALIZADO`/`COMPLETADO` segun decision oficial.
- Eliminar emojis de tabs funcionales mobile o mapearlos a iconos.
- Corregir `canCreateAnimal` usado en Productivo mobile.
- Agregar errores visibles en `aprobaciones-api` cuando una fuente falla.
- Alinear umbrales de stock usando un helper compartido copiado inicialmente.
- Marcar en documentacion interna los modulos web-only y mobile-only.

### 🟡 Mediano plazo - 1 a 3 dias

- Agregar guards por rol a rutas mobile.
- Completar filtros mobile de ganado.
- Unificar validaciones sanitarias y de inventario.
- Ajustar `downloadAndShareReport` solo para el alcance de reportes rapidos mobile.
- Rehacer Home mobile operativo con endpoints autorizados por rol.
- Separar permisos por plataforma para no exponer en mobile modulos de PC.
- Definir allowlist de aprobaciones mobile y dejar aprobaciones masivas en web.

### 🔴 Largo plazo - mas de 3 dias o requiere rediseño

- Crear paquete/contrato compartido de permisos, tipos, validaciones y endpoints.
- Implementar endpoint backend unificado de aprobaciones.
- Consolidar web como back-office: usuarios, auditoria, respaldos, catalogos, compras, reportes avanzados y validaciones masivas.
- Consolidar mobile como operacion de campo: escaneo, captura, consulta rapida, movimientos simples, alertas y perfil.
- Definir design tokens compartidos y migrar estilos web/mobile progresivamente.
- Formalizar que modulos son solo web, solo mobile o universales.
