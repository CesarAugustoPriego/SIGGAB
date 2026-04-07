const prisma = require('../repositories/prisma');
const axios = require('axios'); // or native fetch if node 18+

/**
 * Notifica a todos los administradores con un título y un cuerpo de mensaje.
 */
async function notifyAdmins(title, body, data = {}) {
  try {
    // Buscar todos los usuarios que sean administradores y tengan token
    const admins = await prisma.usuario.findMany({
      where: {
        rol: {
          nombreRol: {
            in: ['Administrador', 'Veterinario Ligero', 'medico veterinario', 'veterinario', 'administrador'] // Assuming some variations
          }
        },
        expoPushToken: { not: null },
        activo: true
      }
    });

    const messages = [];
    for (const admin of admins) {
      if (admin.expoPushToken) {
        messages.push({
          to: admin.expoPushToken,
          sound: 'default',
          title: title,
          body: body,
          data: data,
        });
      }
    }

    if (messages.length === 0) return;

    // The Expo push endpoint accepts an array of messages
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    console.log(`Push notifications sent to ${messages.length} device(s).`);

  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
}

module.exports = { notifyAdmins };
