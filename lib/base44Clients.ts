/**
 * lib/base44Clients.ts
 *
 * Configura aquí las dos apps de Base44.
 * Obtén los valores desde el panel de Base44 → Settings → API.
 */

// Este archivo ya no se usa en la aplicación actual.
// Se deja como placeholder para evitar errores de compilación al incluir todos los archivos TypeScript.

export const clientesApp = null as unknown;
export const conductoresApp = null as unknown;

/**
 * Uso en Dashboard.tsx:
 *
 *   const [bookings, trips, docs] = await Promise.all([
 *     clientesApp.entities.Booking.filter({}, '-created_date', 50),
 *     conductoresApp.entities.Trip.filter({}, '-created_date', 50),
 *     conductoresApp.entities.DriverDocument.filter({}, '-created_date', 100),
 *   ]);
 */
