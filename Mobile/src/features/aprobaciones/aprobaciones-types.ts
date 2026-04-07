export type InboxItemType = 'SANITARIO' | 'PESO' | 'LECHE';

export interface InboxItem {
  id: string; // Unique string composite "PESO_1", "LECHE_2", "SANITARIO_4"
  type: InboxItemType;
  originalId: number;
  title: string;
  subtitle: string;
  date: string;
  details: string;
}

export type ApprovalStatus = 'APROBADO' | 'RECHAZADO';
