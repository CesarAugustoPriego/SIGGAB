const fs = require('fs');
const prisma = require('../src/repositories/prisma');

async function main() {
  let log = 'Start seeding...\n';
  try {
    let user = await prisma.usuario.findFirst();
    if (!user) {
      const rol = await prisma.rol.create({ data: { nombreRol: 'AdministradorSeed' } });
      user = await prisma.usuario.create({
        data: { nombreCompleto: 'Admin Seed', username: 'admin_seed_' + Date.now(), passwordHash: 'xxx', idRol: rol.idRol }
      });
      log += 'Created user\n';
    }

    let raza = await prisma.raza.findFirst();
    if (!raza) raza = await prisma.raza.create({ data: { nombreRaza: 'HolsteinSeed' } });

    let animal = await prisma.animal.findFirst();
    if (!animal) {
      animal = await prisma.animal.create({
        data: { numeroArete: 'MX-' + Date.now(), fechaIngreso: new Date(), pesoInicial: 350.5, idRaza: raza.idRaza }
      });
      log += 'Created animal\n';
    }

    let tipoSan = await prisma.tipoEventoSanitario.findFirst();
    if (!tipoSan) tipoSan = await prisma.tipoEventoSanitario.create({ data: { nombreTipo: 'Tratamiento PEND' } });

    await prisma.eventoSanitario.create({
      data: {
        idAnimal: animal.idAnimal,
        idTipoEvento: tipoSan.idTipoEvento,
        fechaEvento: new Date(),
        diagnostico: 'Fiebre persistente',
        medicamento: 'Ivermectina',
        estadoAprobacion: 'PENDIENTE'
      }
    });
    log += 'Created sanitario\n';

    await prisma.registroPeso.create({
      data: {
        idAnimal: animal.idAnimal,
        peso: 500,
        fechaRegistro: new Date(),
        registradoPor: user.idUsuario,
        estadoValidacion: 'PENDIENTE'
      }
    });

    await prisma.produccionLeche.create({
      data: {
        idAnimal: animal.idAnimal,
        litrosProducidos: 30.5,
        fechaRegistro: new Date(),
        registradoPor: user.idUsuario,
        estadoValidacion: 'PENDIENTE'
      }
    });

    await prisma.eventoReproductivo.create({
      data: {
        idAnimal: animal.idAnimal,
        tipoEvento: 'PARTO',
        fechaEvento: new Date(),
        registradoPor: user.idUsuario,
        estadoValidacion: 'PENDIENTE'
      }
    });

    let tipoIns = await prisma.tipoInsumo.findFirst();
    if (!tipoIns) tipoIns = await prisma.tipoInsumo.create({ data: { nombreTipo: 'MedicinaSeed' } });

    let insumo = await prisma.insumo.findFirst();
    if (!insumo) {
      insumo = await prisma.insumo.create({
        data: { nombreInsumo: 'Gasas', idTipoInsumo: tipoIns.idTipoInsumo, unidadMedida: 'Cajas' }
      });
    }

    const sol = await prisma.solicitudCompra.create({
      data: { fechaSolicitud: new Date(), solicitadaPor: user.idUsuario, estadoSolicitud: 'PENDIENTE' }
    });

    await prisma.detalleSolicitudCompra.create({
      data: { idSolicitud: sol.idSolicitud, idInsumo: insumo.idInsumo, cantidad: 10, precioEstimado: 50, subtotalEstimado: 500 }
    });

    log += 'Finished seeding successfully.\n';
  } catch(e) {
    log += 'ERROR: ' + e.message + '\n' + e.stack;
  } finally {
    fs.writeFileSync('seed-log.txt', log);
    await prisma.$disconnect();
  }
}
main();
