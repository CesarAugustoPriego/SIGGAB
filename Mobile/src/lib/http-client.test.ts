import { httpClient } from './http-client';
import * as SecureStore from 'expo-secure-store';

describe('HTTP Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { msg: 'Test OK' } }),
    });
  });

  it('debe adjuntar el token Bearer en una petición GET genérica si withAuth=true', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ accessToken: 'fake-token-123', refreshToken: 'refresh', user: { idUsuario: 1 } })
    );

    const data = await httpClient.get('/test-route');
    
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[0]).toContain('/test-route');
    expect(fetchCall[1].headers.Authorization).toBe('Bearer fake-token-123');
    expect(data).toEqual({ msg: 'Test OK' });
  });

  it('no debe adjuntar token para rutas públicas (login)', async () => {
    const data = await httpClient.post('/auth/login', { u: 'a', p: 'b' }, false);
    
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[0]).toContain('/auth/login');
    expect(fetchCall[1].headers.Authorization).toBeUndefined();
  });
});
