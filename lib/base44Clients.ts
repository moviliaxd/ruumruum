/**
 * lib/base44Clients.ts
 *
 * Configura aquí las dos apps de Base44.
 * Obtén los valores desde el panel de Base44 → Settings → API.
 */

import { createClient } from '@base44/sdk';

// ── App Clientes (bookings) ──────────────────────────────────
export const clientesApp = createClient({
  appId:        process.env.NEXT_PUBLIC_BASE44_CLIENTES_APP_ID   ?? '',
  token:        process.env.NEXT_PUBLIC_BASE44_CLIENTES_TOKEN    ?? '',
  requiresAuth: false,
  appBaseUrl:   process.env.NEXT_PUBLIC_BASE44_CLIENTES_URL      ?? '',
});

// ── App Conductores (trips, documents, expenses) ─────────────
export const conductoresApp = createClient({
  appId:        process.env.NEXT_PUBLIC_BASE44_CONDUCTORES_APP_ID ?? '',
  token:        process.env.NEXT_PUBLIC_BASE44_CONDUCTORES_TOKEN  ?? '',
  requiresAuth: false,
  appBaseUrl:   process.env.NEXT_PUBLIC_BASE44_CONDUCTORES_URL    ?? '',
});

/**
 * Uso en Dashboard.tsx:
 *
 *   const [bookings, trips, docs] = await Promise.all([
 *     clientesApp.entities.Booking.filter({}, '-created_date', 50),
 *     conductoresApp.entities.Trip.filter({}, '-created_date', 50),
 *     conductoresApp.entities.DriverDocument.filter({}, '-created_date', 100),
 *   ]);
 */
