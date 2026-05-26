'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trip } from '@/lib/supabase';

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  requested:      { label: 'Solicitado',     bg: '#fef9c3', color: '#854d0e' },
  accepted:       { label: 'Aceptado',       bg: '#ede9fe', color: '#5b21b6' },
  in_progress:    { label: 'En curso',       bg: '#dbeafe', color: '#1e40af' },
  pickup_arrived: { label: 'En recogida',    bg: '#cffafe', color: '#164e63' },
  vehicle_picked: { label: 'Vehículo tomado',bg: '#e0e7ff', color: '#3730a3' },
  delivering:     { label: 'En camino',      bg: '#dcfce7', color: '#166534' },
  completed:      { label: 'Completado',     bg: '#dcfce7', color: '#166534' },
  cancelled:      { label: 'Cancelado',      bg: '#fee2e2', color: '#991b1b' },
};

const TRIP_TYPE_LABELS: Record<string, string> = {
  local: 'Local', foraneo: 'Foráneo', nocturno: 'Nocturno',
  empresarial: 'Empresarial', personal: 'Personal',
};

interface Props {
  trip: Trip;
  onClick?: (trip: Trip) => void;
  index?: number;
}

export default function TripCard({ trip, onClick }: Props) {
  const status = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG.requested;

  return (
    <div
      onClick={() => onClick?.(trip)}
      style={{
        background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)',
        borderRadius: 16, padding: '16px', cursor: 'pointer',
        transition: 'transform 0.1s', marginBottom: 0,
      }}
      onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {/* Status + tipo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ background: status.bg, color: status.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
            {status.label}
          </span>
          {trip.trip_type && (
            <span style={{ border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b7280', fontSize: 11, padding: '3px 8px', borderRadius: 6 }}>
              {TRIP_TYPE_LABELS[trip.trip_type] ?? trip.trip_type}
            </span>
          )}
        </div>
        <span style={{ fontSize: 16, color: '#9ca3af' }}>›</span>
      </div>

      {/* Ruta */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0, marginTop: 5 }}/>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.pickup_location}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFC400', flexShrink: 0, marginTop: 5 }}/>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.dropoff_location}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '0.5px solid rgba(0,0,0,0.06)', paddingTop: 10 }}>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#9ca3af' }}>
          <span>
            📅 {trip.trip_date ? format(new Date(trip.trip_date), 'dd MMM', { locale: es }) : '—'}
            {trip.trip_time ? ` · ${trip.trip_time}` : ''}
          </span>
          {trip.vehicle_brand && (
            <span>🚗 {trip.vehicle_brand} {trip.vehicle_model ?? ''}</span>
          )}
        </div>
        {(trip.earnings ?? 0) > 0 && (
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, color: '#151515' }}>
            ${trip.earnings!.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
