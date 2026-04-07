const prisma = require('./src/repositories/prisma.js');

async function seedInventario() {
  console.log('Seeding mock data for Inventario module...');

  // Get a user to act as creator/recorder
  const user = await prisma.usuario.findFirst();
  if (!user) {
    console.error('No users found in database to link records to.');
    return;
  }

  // 1. Crear o buscar Tipos de Insumos
  const tiposData = [
    { nombreTipo: 'Alimentos y Forrajes', descripcion: 'Pacas, granos, concentrados', activo: true },
    { nombreTipo: 'Fármacos Veter.', descripcion: 'Vacunitas, antibióticos, vitaminas', activo: true },
    { nombreTipo: 'Herramientas', descripcion: 'Equipo de campo y clínico', activo: true },
  ];

  const tiposIdMap = {};
  for (const t of tiposData) {
    let tipo = await prisma.tipoInsumo.findFirst({ where: { nombreTipo: t.nombreTipo } });
    if (!tipo) {
      tipo = await prisma.tipoInsumo.create({ data: t });
    }
    tiposIdMap[t.nombreTipo] = tipo.idTipoInsumo;
  }

  // 2. Crear Insumos (Materiales)
  const insumosData = [
    { nombreInsumo: 'Paca de Alfalfa', idTipoInsumo: tiposIdMap['Alimentos y Forrajes'], unidadMedida: 'Paca', stockActual: 120 },
    { nombreInsumo: 'Concentrado Lechero 12%', idTipoInsumo: tiposIdMap['Alimentos y Forrajes'], unidadMedida: 'Costal (40kg)', stockActual: 30 },
    { nombreInsumo: 'Ivermectina 1%', idTipoInsumo: tiposIdMap['Fármacos Veter.'], unidadMedida: 'Frasco (500ml)', stockActual: 5 }, // Low stock warning test
    { nombreInsumo: 'Vacuna Clostridial Múltiple', idTipoInsumo: tiposIdMap['Fármacos Veter.'], unidadMedida: 'Dosis', stockActual: 300 },
    { nombreInsumo: 'Jeringas Desechables 10ml', idTipoInsumo: tiposIdMap['Herramientas'], unidadMedida: 'Pieza', stockActual: 2 }, // Low stock warning test
  ];

  const insumos = [];
  for (const item of insumosData) {
    let check = await prisma.insumo.findFirst({ where: { nombreInsumo: item.nombreInsumo } });
    if (!check) {
      check = await prisma.insumo.create({ data: { ...item, activo: true } });
    } else {
      // update stock just in case
      await prisma.insumo.update({
        where: { idInsumo: check.idInsumo },
        data: { stockActual: item.stockActual }
      });
      check.stockActual = item.stockActual;
    }
    insumos.push(check);
  }

  // 3. Crear algunos movimientos (Entradas y salidas)
  for (const ins of insumos) {
    // Una entrada inicial de inventario
    await prisma.movimientoInventario.create({
      data: {
        idInsumo: ins.idInsumo,
        tipoMovimiento: 'ENTRADA',
        cantidad: ins.stockActual + 15,
        fechaMovimiento: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Hace 3 días
        registradoPor: user.idUsuario
      }
    });

    // Una salida reciente
    await prisma.movimientoInventario.create({
      data: {
        idInsumo: ins.idInsumo,
        tipoMovimiento: 'SALIDA',
        cantidad: 15,
        fechaMovimiento: new Date(), // Hoy
        registradoPor: user.idUsuario
      }
    });
  }

  console.log('Sealed successfully. Refresh the app to see Inventario populated!');
}

seedInventario()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
