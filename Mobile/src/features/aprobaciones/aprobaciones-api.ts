import { canApproveProductivo, canApproveSanitario } from '@/src/features/auth/role-permissions';
import { httpClient } from '@/src/lib/http-client';
import type { ApprovalStatus, InboxItem } from './aprobaciones-types';

function mapPeso(p: any): InboxItem {
  return {
    id: `PESO_${p.idRegistroPeso}`,
    type: 'PESO',
    originalId: p.idRegistroPeso,
    title: `Registro de Peso: ${p.peso} kg`,
    subtitle: `Animal N° ${p.animal?.numeroArete || 'Desconocido'}`,
    date: p.fechaRegistro,
    details: `Lote Productivo: #${p.idLote}`,
  };
}

function mapLeche(l: any): InboxItem {
  return {
    id: `LECHE_${l.idProduccion}`,
    type: 'LECHE',
    originalId: l.idProduccion,
    title: `Produccion Leche: ${l.litrosProducidos} L`,
    subtitle: `Animal N° ${l.animal?.numeroArete || 'Desconocido'}`,
    date: l.fechaRegistro,
    details: `Lote Productivo: #${l.idLote}`,
  };
}

function mapSanitario(s: any): InboxItem {
  return {
    id: `SANITARIO_${s.idEvento}`,
    type: 'SANITARIO',
    originalId: s.idEvento,
    title: `Evento Sanitario: ${s.tipoEvento?.nombreTipo || 'Varios'}`,
    subtitle: `Animal N° ${s.animal?.numeroArete || 'Desconocido'}`,
    date: s.fechaEvento,
    details: `Med: ${s.medicamento || 'N/A'} · Dosis: ${s.dosis || 'N/A'}`,
  };
}

export const aprobacionesApi = {
  getPendingInbox: async (roleName?: string): Promise<InboxItem[]> => {
    const requests: Promise<InboxItem[]>[] = [];

    if (canApproveProductivo(roleName)) {
      requests.push(
        httpClient.get<any[]>('/registros-peso?estado=PENDIENTE').then((items) => items.map(mapPeso)),
        httpClient.get<any[]>('/produccion-leche?estado=PENDIENTE').then((items) => items.map(mapLeche)),
      );
    }

    if (canApproveSanitario(roleName)) {
      requests.push(
        httpClient.get<any[]>('/eventos-sanitarios?estado=PENDIENTE').then((items) => items.map(mapSanitario)),
      );
    }

    const inbox = (await Promise.all(requests)).flat();
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
        throw new Error('Tipo de inbox no soportado para validacion');
    }
  },
};
