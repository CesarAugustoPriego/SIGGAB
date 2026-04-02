# SIGGAB Frontend

## Checkpoint 1 (Auth)
Frontend para validar login y sesion contra backend SIGGAB.

## Arquitectura actual (base reusable)
- `src/app/` orquestacion de la aplicacion.
- `src/features/auth/` logica y vistas del modulo de autenticacion.
- `src/shared/ui/` componentes reutilizables (`Button`, `TextField`).
- `src/lib/` cliente HTTP y almacenamiento de sesion.

### Requisitos
- Backend corriendo en `http://localhost:3000`
- Node.js 22.15.0

### Configuracion
1. Copia `.env.example` a `.env`.
2. Ajusta `VITE_API_BASE_URL` si tu backend usa otra URL.

### Ejecucion
```bash
npm install
npm run dev
```

## Imagenes y placeholders
- Hero login (internet): `public/images/auth-hero-register.jpg`
- Hero registro (internet): `public/images/auth-hero-alt.jpg`
- Placeholder para logo principal: `public/placeholders/logo-rancho-placeholder.svg`

Para poner tu logo final de Rancho Los Alpes, reemplaza:
- `public/placeholders/logo-rancho-placeholder.svg`

## Prueba manual
1. Inicia sesion con:
- usuario: `admin`
- contrasena: `SiggabAdmin2026!`
2. Verifica que muestre usuario y rol.
3. Pulsa `Probar /auth/me`.
4. Pulsa `Cerrar sesion`.
5. Intenta login con contrasena incorrecta y valida mensaje `401`.
6. Intenta 5 veces malas para validar bloqueo `423`.

## Siguiente checkpoint
- Usuarios y roles (CRUD administrativo) integrado en Front.
