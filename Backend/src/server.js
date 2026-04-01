require('dotenv').config();

const app = require('./app');
const env = require('./config/env');
const prisma = require('./repositories/prisma');
const { startAutoBackupScheduler, stopAutoBackupScheduler } = require('./services/respaldos.service');

const PORT = env.PORT;

async function main() {
  try {
    // Verificar conexión a la BD
    await prisma.$connect();
    console.log('✅ Conexión a PostgreSQL establecida');

    app.listen(PORT, () => {
      console.log(`🚀 SIGGAB API corriendo en http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Entorno: ${env.NODE_ENV}`);
    });

    startAutoBackupScheduler();
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
}

// Manejo de señales para cierre limpio
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  stopAutoBackupScheduler();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  stopAutoBackupScheduler();
  await prisma.$disconnect();
  process.exit(0);
});

main();
