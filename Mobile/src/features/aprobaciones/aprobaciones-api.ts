import { httpClient } from '@/src/lib/http-client';
import type { ApprovalStatus, InboxItem } from './aprobaciones-types';

export const aprobacionesApi = {
  getPendingInbox: async (): Promise<InboxItem[]> => {
    // We fetch pending items from the 3 modules safely. If one fails, we catch it so it doesn't break the whole inbox.
    const [pesos, leches, sanitarios] = await Promise.all([
      httpClient.get<any[]>('/registros-peso?estado=PENDIENTE').catch(() => []),
      httpClient.get<any[]>('/produccion-leche?estado=PENDIENTE').catch(() => []),
      httpClient.get<any[]>('/eventos-sanitarios?estado=PENDIENTE').catch(() => []),
    ]);

    const inbox: InboxItem[] = [];

    pesos.forEach((p) => {
      inbox.push({
        id: `PESO_${p.idRegistroPeso}`,
        type: 'PESO',
        originalId: p.idRegistroPeso,
        title: `Registro de Peso: ${p.peso} kg`,
        subtitle: `Animal N° ${p.animal?.numeroArete || 'Desconocido'}`,
        date: p.fechaRegistro,
        details: `Lote Productivo: #${p.idLote}`,
      });
    });

    leches.forEach((l) => {
      inbox.push({
        id: `LECHE_${l.idProduccion}`,
        type: 'LECHE',
        originalId: l.idProduccion,
        title: `Producción Leche: ${l.litrosProducidos} L`,
        subtitle: `Animal N° ${l.animal?.numeroArete || 'Desconocido'}`,
        date: l.fechaRegistro,
        details: `Lote Productivo: #${l.idLote}`,
      });
    });

    sanitarios.forEach((s) => {
      inbox.push({
        id: `SANITARIO_${s.idEvento}`,
        type: 'SANITARIO',
        originalId: s.idEvento,
        title: `Evento Sanitario: ${s.tipoEvento?.nombreTipo || 'Varios'}`,
        subtitle: `Animal N° ${s.animal?.numeroArete || 'Desconocido'}`,
        date: s.fechaEvento,
        details: `Med: ${s.medicamento || 'N/A'} · Dosis: ${s.dosis || 'N/A'}`,
      });
    });

    // Sort descending by date
    return inbox.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  approveItem: async (item: InboxItem, status: ApprovalStatus) => {
    switch (item.type) {
      case 'PESO':
        return httpClient.patch(`/registros-peso/${item.originalId}/validar`, { estadoValidacion: status });
      case 'LECHE':
        return httpClient.patch(`/produccion-leche/${item.originalId}/validar`, { estadoValidacion: status });
      case 'SANITARIO':
        return httpClient.patch(`/eventos-sanitarios/${item.originalId}/aprobar`, { estadoAprobacion: status });
      default:
        throw new Error('Tipo de inbox no soportado para validación');
    }
  },
};
