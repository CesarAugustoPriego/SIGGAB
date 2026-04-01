export interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
  errors: null;
}

export interface ApiErrorPayload {
  success: false;
  data: null;
  message: string;
  errors: unknown;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiErrorPayload;

export class ApiClientError extends Error {
  status: number;
  payload: ApiErrorPayload | null;

  constructor(message: string, status: number, payload: ApiErrorPayload | null = null) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.payload = payload;
  }
}

