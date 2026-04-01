const { sendForbidden } = require('../utils/response');

const ROLE_ALIASES = new Map([
  ['propietario', 'propietario'],
  ['administrador', 'administrador'],
  ['medico veterinario', 'medico-veterinario'],
  ['médico veterinario', 'medico-veterinario'],
  ['mÃ©dico veterinario', 'medico-veterinario'],
  ['produccion', 'produccion'],
  ['producción', 'produccion'],
  ['producciÃ³n', 'produccion'],
  ['campo', 'campo'],
  ['almacen', 'almacen'],
  ['almacén', 'almacen'],
  ['almacÃ©n', 'almacen'],
]);

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function canonicalRole(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (ROLE_ALIASES.has(raw)) return ROLE_ALIASES.get(raw);

  const normalized = normalizeText(value);
  if (ROLE_ALIASES.has(normalized)) return ROLE_ALIASES.get(normalized);

  return normalized;
}

/**
 * Factory middleware para verificacion de roles.
 */
function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return sendForbidden(res, 'No se pudo determinar el rol del usuario');
    }

    const userRole = canonicalRole(req.user.nombreRol);
    const allowedRoles = rolesPermitidos.map(canonicalRole);

    if (!allowedRoles.includes(userRole)) {
      return sendForbidden(
        res,
        `Acceso denegado. Rol "${req.user.nombreRol}" no tiene permisos para esta accion. Roles permitidos: ${rolesPermitidos.join(', ')}`
      );
    }

    next();
  };
}

module.exports = requireRole;
