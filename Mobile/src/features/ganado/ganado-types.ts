export type EstadoAnimal = 'ACTIVO' | 'VENDIDO' | 'MUERTO' | 'TRANSFERIDO';

export interface Raza {
  idRaza: number;
  nombreRaza: string;
  descripcion?: string | null;
  activo?: boolean;
}

export interface Animal {
  idAnimal: number;
  numeroArete: string;
  fechaIngreso: string;
  pesoInicial: number | string;
  idRaza: number;
  procedencia: string;
  edadEstimada: number;
  estadoSanitarioInicial: string;
  estadoActual: EstadoAnimal;
  motivoBaja: string | null;
  fechaBaja: string | null;
  raza?: Raza | null;
}

export interface CreateAnimalInput {
  numeroArete: string;
  fechaIngreso: string;
  pesoInicial: number;
  idRaza: number;
  procedencia: string;
  edadEstimada: number;
  estadoSanitarioInicial: string;
}

export interface UpdateAnimalInput {
  fechaIngreso?: string;
  pesoInicial?: number;
  idRaza?: number;
  procedencia?: string;
  edadEstimada?: number;
  estadoSanitarioInicial?: string;
}

export interface BajaAnimalInput {
  estadoActual: Exclude<EstadoAnimal, 'ACTIVO'>;
  motivoBaja: string;
  fechaBaja: string;
}

export interface AnimalFilters {
  estadoActual?: EstadoAnimal | 'TODOS';
  idRaza?: number;
}

export interface HistorialAnimalResponse {
  animal: Animal;
  historial: {
    sanitario: {
      eventos: {
        idEvento: number;
        fechaEvento: string;
        diagnostico: string;
        estadoAprobacion: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
        tipoEvento?: { nombreTipo: string } | null;
      }[];
      calendario: {
        idCalendario: number;
        fechaProgramada: string;
        estado: 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';
        tipoEvento?: { nombreTipo: string } | null;
      }[];
    };
    productivo: {
      registrosPeso: {
        idRegistroPeso: number;
        fechaRegistro: string;
        peso: number | string;
        estadoValidacion: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
      }[];
      produccionesLeche: {
        idProduccion: number;
        fechaRegistro: string;
        litrosProducidos: number | string;
        estadoValidacion: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
      }[];
      eventosReproductivos: {
        idEventoReproductivo: number;
        fechaEvento: string;
        tipoEvento: string;
        estadoValidacion: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
      }[];
    };
    resumen: {
      totalEventosSanitarios: number;
      totalRegistrosPeso: number;
      totalRegistrosLeche: number;
      totalEventosReproductivos: number;
    };
  };
}
