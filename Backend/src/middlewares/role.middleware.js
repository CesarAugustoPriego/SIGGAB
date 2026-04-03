const { sendForbidden } = require('../utils/response');

const ROLE_ALIASES = new Map([
  ['propietario', 'propietario'],
  ['administrador', 'administrador'],
  ['veterinario', 'medico-veterinario'],
  ['medico veterinario', 'medico-veterinario'],
  ['medico-veterinario', 'medico-veterinario'],
  ['produccion', 'produccion'],
  ['campo', 'campo'],
  ['almacen', 'almacen'],
]);

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalRole(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (ROLE_ALIASES.has(raw)) return ROLE_ALIASES.get(raw);

  const normalized = normalizeText(value);
  if (ROLE_ALIASES.has(normalized)) return ROLE_ALIASES.get(normalized);

  // Tolerancia ante variaciones de acentos/codificacion heredada.
  if (normalized.includes('veterinario')) return 'medico-veterinario';
  if (normalized.includes('produc')) return 'produccion';
  if (normalized.includes('almac')) return 'almacen';

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
