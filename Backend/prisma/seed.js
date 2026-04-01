require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Crear pool y adapter para Prisma 7.x
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BCRYPT_ROUNDS = 12;

async function main() {
  console.log('🌱 Ejecutando seed de SIGGAB...\n');

  // ─── 1. ROLES ───
  const rolesData = [
    { nombreRol: 'Propietario', descripcion: 'Consultor estratégico. Consulta reportes, dashboard e indicadores. Sin operación directa.' },
    { nombreRol: 'Administrador', descripcion: 'Gestor / Autorizador. Gestión completa del sistema, usuarios, validaciones y compras.' },
    { nombreRol: 'Médico Veterinario', descripcion: 'Registrador / Autorizador. Registra y autoriza eventos sanitarios. Gestiona calendario sanitario.' },
    { nombreRol: 'Producción', descripcion: 'Registrador. Registra peso, leche y eventos reproductivos.' },
    { nombreRol: 'Campo', descripcion: 'Registrador. Captura en campo: escaneo de arete, registro básico de eventos.' },
    { nombreRol: 'Almacén', descripcion: 'Registrador / Solicitante. Gestión de inventario y solicitudes de compra.' },
  ];

  console.log('📋 Insertando roles...');
  for (const rolData of rolesData) {
    const rol = await prisma.rol.upsert({
      where: { idRol: rolesData.indexOf(rolData) + 1 },
      update: rolData,
      create: rolData,
    });
    console.log(`   ✓ ${rol.nombreRol}`);
  }

  // ─── 2. USUARIO ADMINISTRADOR POR DEFECTO ───
  console.log('\n👤 Creando usuario administrador...');
  const adminPassword = await bcrypt.hash('SiggabAdmin2026!', BCRYPT_ROUNDS);

  const admin = await prisma.usuario.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      nombreCompleto: 'Administrador del Sistema',
      username: 'admin',
      passwordHash: adminPassword,
      idRol: 2, // Administrador
      activo: true,
    },
  });
  console.log(`   ✓ Usuario: ${admin.username} (Rol: Administrador)`);
  console.log(`   ℹ️  Contraseña: SiggabAdmin2026!`);

  // ─── 3. TIPOS DE EVENTO SANITARIO ───
  console.log('\n🏥 Insertando tipos de evento sanitario...');
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
    console.log(`   ✓ ${tipo.nombreTipo}`);
  }

  // ─── 4. RAZAS DE EJEMPLO ───
  console.log('\n🐄 Insertando razas de ganado...');
  const razasData = [
    { nombreRaza: 'Holstein' },
    { nombreRaza: 'Simmental' },
    { nombreRaza: 'Angus' },
    { nombreRaza: 'Hereford' },
    { nombreRaza: 'Brahman' },
    { nombreRaza: 'Charolais' },
    { nombreRaza: 'Jersey' },
    { nombreRaza: 'Limousin' },
  ];

  for (const razaData of razasData) {
    const raza = await prisma.raza.upsert({
      where: { idRaza: razasData.indexOf(razaData) + 1 },
      update: razaData,
      create: razaData,
    });
    console.log(`   ✓ ${raza.nombreRaza}`);
  }

  console.log('\n✅ Seed completado exitosamente');
  console.log('═══════════════════════════════════════');
  console.log('Para iniciar el servidor: npm run dev');
  console.log('Para login: POST /api/auth/login');
  console.log('  { "username": "admin", "password": "SiggabAdmin2026!" }');
  console.log('═══════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
