require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BCRYPT_ROUNDS = 12;

// ── Razas comunes de ganado vacuno en Tabasco ───────────────────────────
const RAZAS_TABASCO = [
  { nombreRaza: 'Brahman', descripcion: 'El más común en el sureste mexicano por su adaptabilidad al clima húmedo y resistencia a parásitos.' },
  { nombreRaza: 'Suizo Pardo (Brown Swiss)', descripcion: 'Muy utilizado en la región para la producción de leche y carne.' },
  { nombreRaza: 'Simbrah', descripcion: 'Cruza de Simmental y Brahman, popular por su rápido crecimiento en climas tropicales.' },
  { nombreRaza: 'Nelore', descripcion: 'Raza cebuína fundamental en la producción de carne, valorada por su rusticidad.' },
  { nombreRaza: 'Cruzas (Pardo Suizo/Cebú)', descripcion: 'Muy utilizadas en sistemas de doble propósito, combinando producción de leche y rusticidad cebuína.' },
  { nombreRaza: 'Brangus/Angus', descripcion: 'Incrementando su presencia para mejorar la calidad de la carne (marmoleo).' },
];

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

async function seedBreedCatalog() {
  const razasExistentes = await prisma.raza.findMany({ orderBy: { idRaza: 'asc' } });

  const nombresTarget = RAZAS_TABASCO.map((r) => normalizeText(r.nombreRaza));

  // Upsert each target breed
  const createdRazas = [];
  for (const razaData of RAZAS_TABASCO) {
    const normalized = normalizeText(razaData.nombreRaza);
    const existente = razasExistentes.find((r) => normalizeText(r.nombreRaza) === normalized);

    if (existente) {
      const updated = await prisma.raza.update({
        where: { idRaza: existente.idRaza },
        data: { nombreRaza: razaData.nombreRaza, activo: true },
      });
      createdRazas.push(updated);
    } else {
      const created = await prisma.raza.create({
        data: { nombreRaza: razaData.nombreRaza, activo: true },
      });
      createdRazas.push(created);
    }
  }

  // Deactivate any breed NOT in the target list
  const activeIds = createdRazas.map((r) => r.idRaza);
  const otrasRazas = razasExistentes.filter((r) => !activeIds.includes(r.idRaza) && r.activo);
  for (const raza of otrasRazas) {
    await prisma.raza.update({
      where: { idRaza: raza.idRaza },
      data: { activo: false },
    });
  }

  return createdRazas;
}

async function main() {
  console.log('Ejecutando seed de SIGGAB...\n');

  const rolesData = [
    { nombreRol: 'Propietario', descripcion: 'Consultor estratégico. Consulta reportes, dashboard e indicadores. Sin operación directa.' },
    { nombreRol: 'Administrador', descripcion: 'Gestor / Autorizador. Gestión completa del sistema, usuarios, validaciones y compras.' },
    { nombreRol: 'Médico Veterinario', descripcion: 'Registrador / Autorizador. Registra y autoriza eventos sanitarios. Gestiona calendario sanitario.' },
    { nombreRol: 'Producción', descripcion: 'Registrador. Registra peso, leche y eventos reproductivos.' },
    { nombreRol: 'Campo', descripcion: 'Registrador. Captura en campo: escaneo de arete, registro básico de eventos.' },
    { nombreRol: 'Almacén', descripcion: 'Registrador / Solicitante. Gestión de inventario y solicitudes de compra.' },
  ];

  console.log('Insertando roles...');
  for (const rolData of rolesData) {
    const rol = await prisma.rol.upsert({
      where: { idRol: rolesData.indexOf(rolData) + 1 },
      update: rolData,
      create: rolData,
    });
    console.log(`  OK ${rol.nombreRol}`);
  }

  console.log('\nCreando usuario administrador...');
  const adminPassword = await bcrypt.hash('SiggabAdmin2026!', BCRYPT_ROUNDS);

  const admin = await prisma.usuario.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      nombreCompleto: 'Administrador del Sistema',
      username: 'admin',
      passwordHash: adminPassword,
      idRol: 2,
      activo: true,
    },
  });
  console.log(`  OK Usuario: ${admin.username} (Rol: Administrador)`);
  console.log('  INFO Contrasena: SiggabAdmin2026!');

  console.log('\nInsertando tipos de evento sanitario...');
  const tiposEvento = [
    { nombreTipo: 'Vacuna' },
    { nombreTipo: 'Enfermedad' },
    { nombreTipo: 'Tratamiento' },
  ];

  for (const tipoData of tiposEvento) {
    const tipo = await prisma.tipoEventoSanitario.upsert({
      where: { idTipoEvento: tiposEvento.indexOf(tipoData) + 1 },
      update: tipoData,
      create: tipoData,
    });
    console.log(`  OK ${tipo.nombreTipo}`);
  }

  console.log('\nAjustando catalogo de razas de Tabasco...');
  const razasCreadas = await seedBreedCatalog();
  for (const raza of razasCreadas) {
    console.log(`  OK ${raza.nombreRaza}`);
  }

  console.log('\nSeed completado exitosamente');
  console.log('Para iniciar el servidor: npm run dev');
  console.log('Para login: POST /api/auth/login');
  console.log('  { "username": "admin", "password": "SiggabAdmin2026!" }');
}

main()
  .catch((error) => {
    console.error('Error en seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
