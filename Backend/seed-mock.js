const prisma = require('./src/repositories/prisma.js');

async function seed() {
  console.log('Seeding mock data for Productivo module...');

  // Get a user to act as creator/recorder
  const user = await prisma.usuario.findFirst();
  if (!user) {
    console.error('No users found in database to link records to.');
    return;
  }

  // Get the most recent active Lote, or create one
  let lote = await prisma.loteValidacionProductiva.findFirst({
    where: { estado: 'APROBADO' },
    orderBy: { idLote: 'desc' }
  });

  if (!lote) {
    lote = await prisma.loteValidacionProductiva.create({
      data: {
        fechaInicio: new Date('2025-01-01'),
        fechaFin: new Date('2025-12-31'),
        creadoPor: user.idUsuario,
        estado: 'APROBADO',
      }
    });
  }

  // Get all active animals to seed data for
  const animales = await prisma.animal.findMany({
    where: { estadoActual: 'ACTIVO' }
  });

  if (animales.length === 0) {
    console.error('No active animals found.');
    return;
  }

  // Find the specific animal the user is looking at in the UI
  const animal1 = await prisma.animal.findUnique({
    where: { numeroArete: 'MZ-AGS-1011' }
  });

  if (!animal1) {
    console.error('Animal MZ-AGS-1011 not found.');
    return;
  }

  // Weight history for Animal 1
  const pesos = [300, 320, 350, 345, 370, 395, 410, 425, 455];
  for (let i = 0; i < pesos.length; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (pesos.length - i) * 10); // Every 10 days
    await prisma.registroPeso.create({
      data: {
        idAnimal: animal1.idAnimal,
        idLote: lote.idLote,
        peso: pesos[i],
        fechaRegistro: d,
        registradoPor: user.idUsuario,
        estadoValidacion: 'APROBADO',
        validadoPor: user.idUsuario
      }
    });
  }

  // Milk history for all animals (herd)
  for (let i = 0; i < 10; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (10 - i));
    
    // Add milk for up to 3 animals each day
    for(let a = 0; a < Math.min(3, animales.length); a++) {
       await prisma.produccionLeche.create({
         data: {
            idAnimal: animales[a].idAnimal,
            idLote: lote.idLote,
            litrosProducidos: 10 + (Math.random() * 5), // 10 to 15L
            fechaRegistro: d,
            registradoPor: user.idUsuario,
            estadoValidacion: 'APROBADO',
            validadoPor: user.idUsuario
         }
       });
    }
  }

  // One reproductive event for Animal 1
  await prisma.eventoReproductivo.create({
    data: {
      idAnimal: animal1.idAnimal,
      idLote: lote.idLote,
      tipoEvento: 'CELO',
      fechaEvento: new Date(),
      observaciones: 'Celo detectado en la mañana.',
      registradoPor: user.idUsuario,
      estadoValidacion: 'APROBADO',
      validadoPor: user.idUsuario
    }
  });

  console.log('Sealed successfully. Refresh the app to see the data!');
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
