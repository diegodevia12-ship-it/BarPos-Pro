
export const IS_DEMO = true; 

/**
 * Función central de fetch con timeout de 5 segundos y manejo de errores
 * para evitar que la aplicación se bloquee si el servidor no responde.
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  // En modo DEMO, interceptamos las llamadas inmediatamente
  if (IS_DEMO) {
    clearTimeout(timeoutId);
    return new Promise((_, reject) => {
      // Retraso mínimo para simular latencia de red sin bloquear el hilo principal
      setTimeout(() => reject(new Error("MODO DEMO: Usando almacenamiento local (localStorage)")), 50);
    });
  }

  try {
    const baseUrl = '/api'; // Ajustar según despliegue
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error del servidor: ${response.status}`);
    }

    return await response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn('La petición al servidor excedió el tiempo límite (5s)');
      throw new Error("Tiempo de espera agotado. Revisa tu conexión.");
    }
    console.error("Error en apiFetch:", err);
    throw err;
  }
}

export const apiRequest = (endpoint: string, options: any = {}) => {
  return apiFetch(endpoint, options);
};
