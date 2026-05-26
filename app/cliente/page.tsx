'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/src/lib/AuthContext';
import { supabase, Trip } from '@/lib/supabase';
import RoleGate from '@/src/components/RoleGate';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Screen = 'home' | 'solicitar' | 'mis-viajes' | 'detalle' | 'perfil';

interface NuevoViaje {
  pickup_location: string;
  dropoff_location: string;
  trip_date: string;
  trip_time: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_color: string;
  vehicle_plates: string;
  vehicle_type: string;
  trip_type: string;
  notes: string;
}

const INITIAL_VIAJE: NuevoViaje = {
  pickup_location: '',
  dropoff_location: '',
  trip_date: '',
  trip_time: '',
  vehicle_brand: '',
  vehicle_model: '',
  vehicle_color: '',
  vehicle_plates: '',
  vehicle_type: 'sedan',
  trip_type: 'local',
  notes: '',
};

const STATUS_LABEL: Record<string, string> = {
  requested:      'Solicitado',
  accepted:       'Aceptado',
  in_progress:    'En camino',
  pickup_arrived: 'Conductor llegó',
  vehicle_picked: 'Vehículo recogido',
  delivering:     'En traslado',
  completed:      'Completado',
  cancelled:      'Cancelado',
};

const STATUS_COLOR: Record<string, string> = {
  requested:      '#F59E0B',
  accepted:       '#3B82F6',
  in_progress:    '#8B5CF6',
  pickup_arrived: '#8B5CF6',
  vehicle_picked: '#FFC400',
  delivering:     '#FFC400',
  completed:      '#10B981',
  cancelled:      '#EF4444',
};

// ─── Utilidades ───────────────────────────────────────────────────────────────

const S = {
  // Layout
  page:         { minHeight: '100vh', background: '#F8F8F5', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: 480, margin: '0 auto', position: 'relative' as const, paddingBottom: 80 },
  topbar:       { background: '#151515', padding: '16px 20px 24px', position: 'sticky' as const, top: 0, zIndex: 10 },
  topbarRow:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo:         { width: 36, height: 36, background: '#FFC400', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: '#151515', fontFamily: 'Montserrat, sans-serif', letterSpacing: -1 },
  brandName:    { color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, lineHeight: 1 },
  brandSub:     { color: '#FFC400', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase' as const, fontFamily: 'Montserrat, sans-serif' },
  signOutBtn:   { background: 'transparent', border: '0.5px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)', fontSize: 12, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' },

  // Contenido
  content:      { padding: '0 16px 16px' },
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 2, textTransform: 'uppercase' as const, marginBottom: 10, fontFamily: 'Montserrat, sans-serif' },

  // Cards
  card:         { background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: '18px', marginBottom: 10 },
  cardAccent:   { background: '#151515', border: 'none', borderRadius: 16, padding: '18px', marginBottom: 10 },
  cardYellow:   { background: '#FFC400', border: 'none', borderRadius: 16, padding: '18px', marginBottom: 10 },

  // Botones
  btnPrimary:   { width: '100%', background: '#FFC400', color: '#151515', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, padding: '14px', border: 'none', cursor: 'pointer', borderRadius: 12 },
  btnSecondary: { width: '100%', background: 'transparent', color: '#151515', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, padding: '13px', border: '1.5px solid rgba(0,0,0,0.12)', cursor: 'pointer', borderRadius: 12 },
  btnGhost:     { background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' },

  // Formulario
  label:        { display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: 6, fontFamily: 'Montserrat, sans-serif' },
  input:        { width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111', padding: '11px 14px', fontSize: 14, outline: 'none', borderRadius: 10, boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  select:       { width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111', padding: '11px 14px', fontSize: 14, outline: 'none', borderRadius: 10, boxSizing: 'border-box' as const, fontFamily: 'inherit', appearance: 'none' as const },
  textarea:     { width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111', padding: '11px 14px', fontSize: 14, outline: 'none', borderRadius: 10, boxSizing: 'border-box' as const, fontFamily: 'inherit', resize: 'vertical' as const },
  formGroup:    { marginBottom: 14 },
  row2:         { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },

  // Nav inferior
  nav:          { position: 'fixed' as const, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderTop: '0.5px solid rgba(0,0,0,0.08)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '8px 0 16px' },
  navItem:      { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit' },
  navLabel:     { fontSize: 10, fontWeight: 700, fontFamily: 'Montserrat, sans-serif' },

  // Loading / empty
  centered:     { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#151515' },
  emptyState:   { textAlign: 'center' as const, padding: '48px 20px' },
};

// ─── Componentes pequeños ─────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={S.centered}>
      <div style={{ color: '#FFC400', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15 }}>
        Cargando...
      </div>
    </div>
  );
}

function NoSession() {
  return (
    <div style={S.centered}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 16 }}>No hay sesión activa</div>
        <a href="/login" style={{ color: '#FFC400', fontSize: 14 }}>Ir al login</a>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{
      background: `${STATUS_COLOR[status] || '#9CA3AF'}18`,
      color: STATUS_COLOR[status] || '#9CA3AF',
      fontSize: 11, fontWeight: 700,
      padding: '4px 10px', borderRadius: 999,
      fontFamily: 'Montserrat, sans-serif', letterSpacing: 0.5,
    }}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function TripProgress({ status }: { status: string }) {
  const steps = ['requested', 'accepted', 'in_progress', 'vehicle_picked', 'delivering', 'completed'];
  const currentIdx = steps.indexOf(status);
  const isCancelled = status === 'cancelled';

  return (
    <div style={{ padding: '16px 0 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {steps.map((step, i) => {
          const done = i <= currentIdx && !isCancelled;
          const active = i === currentIdx && !isCancelled;
          return (
            <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: active ? '#FFC400' : done ? '#10B981' : '#E5E7EB',
                border: active ? '2px solid #FFC400' : 'none',
                boxShadow: active ? '0 0 0 4px rgba(255,196,0,0.2)' : 'none',
                flexShrink: 0,
              }} />
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 2, background: done && i < currentIdx ? '#10B981' : '#E5E7EB' }} />
              )}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: isCancelled ? '#EF4444' : '#6B7280', marginTop: 8, textAlign: 'center' }}>
        {isCancelled ? 'Viaje cancelado' : STATUS_LABEL[status]}
      </div>
    </div>
  );
}

// ─── Pantallas ────────────────────────────────────────────────────────────────

function HomeScreen({
  profile, trips, onSolicitar, onDetalleViaje
}: {
  profile: { full_name?: string; email: string };
  trips: Trip[];
  onSolicitar: () => void;
  onDetalleViaje: (t: Trip) => void;
}) {
  const activos = trips.filter(t => !['completed', 'cancelled'].includes(t.status));
  const ultimo  = trips.find(t => t.status === 'completed');
  const nombre  = profile.full_name?.split(' ')[0] || 'Cliente';

  return (
    <>
      {/* Hero saludo */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ fontSize: 22, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: '#fff', marginBottom: 2 }}>
          ¡Hola, {nombre}! 👋
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>¿Qué vehículo vamos a mover hoy?</div>
      </div>

      <div style={S.content}>
        {/* CTA principal */}
        <div style={{ ...S.cardYellow, marginTop: 20, cursor: 'pointer' }} onClick={onSolicitar}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 20, color: '#151515' }}>
                Solicitar traslado
              </div>
              <div style={{ fontSize: 13, color: 'rgba(21,21,21,0.6)', marginTop: 4 }}>
                Conductores certificados · Evidencia digital
              </div>
            </div>
            <div style={{ fontSize: 40 }}>🚗</div>
          </div>
        </div>

        {/* Viajes activos */}
        {activos.length > 0 && (
          <div style={S.section}>
            <div style={S.sectionTitle}>En curso</div>
            {activos.map(t => (
              <div key={t.id} style={{ ...S.card, cursor: 'pointer', borderLeft: `3px solid ${STATUS_COLOR[t.status]}` }}
                onClick={() => onDetalleViaje(t)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 2 }}>
                      {t.pickup_location}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>→ {t.dropoff_location}</div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <TripProgress status={t.status} />
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                  {t.vehicle_brand} {t.vehicle_model} · {t.vehicle_plates}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats rápidas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div style={S.cardAccent}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>MIS VIAJES</div>
            <div style={{ fontSize: 28, fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: '#FFC400' }}>{trips.length}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>totales</div>
          </div>
          <div style={S.cardAccent}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>COMPLETADOS</div>
            <div style={{ fontSize: 28, fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: '#10B981' }}>
              {trips.filter(t => t.status === 'completed').length}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>exitosos</div>
          </div>
        </div>

        {/* Último viaje */}
        {ultimo && (
          <div style={S.section}>
            <div style={S.sectionTitle}>Último traslado</div>
            <div style={{ ...S.card, cursor: 'pointer' }} onClick={() => onDetalleViaje(ultimo)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
                  {ultimo.pickup_location} → {ultimo.dropoff_location}
                </div>
                <StatusBadge status={ultimo.status} />
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                {ultimo.vehicle_brand} {ultimo.vehicle_model} · {new Date(ultimo.trip_date).toLocaleDateString('es-MX')}
              </div>
            </div>
          </div>
        )}

        {/* Sin viajes */}
        {trips.length === 0 && (
          <div style={S.emptyState}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🛣️</div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18, color: '#111', marginBottom: 8 }}>
              Sin traslados aún
            </div>
            <div style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>
              Solicita tu primer traslado vehicular certificado.
            </div>
            <button style={{ ...S.btnPrimary, maxWidth: 240 }} onClick={onSolicitar}>
              Solicitar ahora
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function SolicitarScreen({
  onBack, clientEmail, clientName, onSuccess
}: {
  onBack: () => void;
  clientEmail: string;
  clientName: string;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<NuevoViaje>(INITIAL_VIAJE);
  const [step, setStep]         = useState(1); // 1: ruta, 2: vehículo, 3: confirmar
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const set = (k: keyof NuevoViaje, v: string) => setForm(f => ({ ...f, [k]: v }));

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async () => {
    setLoading(true); setError('');
    const { error } = await supabase.from('trips').insert({
      ...form,
      client_email: clientEmail,
      client_name:  clientName,
      status:        'requested',
      payment_status:'pending',
      created_by:    clientEmail,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    onSuccess();
  };

  const step1Valid = form.pickup_location && form.dropoff_location && form.trip_date;
  const step2Valid = form.vehicle_brand && form.vehicle_model && form.vehicle_plates;

  return (
    <>
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={S.btnGhost} onClick={onBack}>
          <span style={{ fontSize: 22, color: '#fff' }}>←</span>
        </button>
        <div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: '#fff', fontSize: 17 }}>
            Nuevo traslado
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Paso {step} de 3</div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div style={{ margin: '14px 16px 0', height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 999 }}>
        <div style={{ height: '100%', background: '#FFC400', borderRadius: 999, width: `${(step / 3) * 100}%`, transition: 'width 0.3s' }} />
      </div>

      <div style={{ ...S.content, paddingTop: 20 }}>

        {/* PASO 1: Ruta */}
        {step === 1 && (
          <div style={S.card}>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: '#111', marginBottom: 18 }}>
              📍 Ruta del traslado
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Origen</label>
              <input style={S.input} placeholder="Calle, colonia, ciudad..." value={form.pickup_location}
                onChange={e => set('pickup_location', e.target.value)} />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Destino</label>
              <input style={S.input} placeholder="Calle, colonia, ciudad..." value={form.dropoff_location}
                onChange={e => set('dropoff_location', e.target.value)} />
            </div>
            <div style={S.row2}>
              <div style={S.formGroup}>
                <label style={S.label}>Fecha</label>
                <input type="date" style={S.input} min={today} value={form.trip_date}
                  onChange={e => set('trip_date', e.target.value)} />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Hora</label>
                <input type="time" style={S.input} value={form.trip_time}
                  onChange={e => set('trip_time', e.target.value)} />
              </div>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Tipo de traslado</label>
              <select style={S.select} value={form.trip_type} onChange={e => set('trip_type', e.target.value)}>
                <option value="local">Local (misma ciudad)</option>
                <option value="foraneo">Foráneo</option>
                <option value="nocturno">Nocturno</option>
                <option value="empresarial">Empresarial / Flotilla</option>
                <option value="personal">Personal</option>
              </select>
            </div>
            <button style={{ ...S.btnPrimary, opacity: step1Valid ? 1 : 0.5 }}
              disabled={!step1Valid} onClick={() => setStep(2)}>
              Continuar →
            </button>
          </div>
        )}

        {/* PASO 2: Vehículo */}
        {step === 2 && (
          <div style={S.card}>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: '#111', marginBottom: 18 }}>
              🚗 Datos del vehículo
            </div>
            <div style={S.row2}>
              <div style={S.formGroup}>
                <label style={S.label}>Marca</label>
                <input style={S.input} placeholder="Toyota, BMW..." value={form.vehicle_brand}
                  onChange={e => set('vehicle_brand', e.target.value)} />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Modelo</label>
                <input style={S.input} placeholder="Corolla, X5..." value={form.vehicle_model}
                  onChange={e => set('vehicle_model', e.target.value)} />
              </div>
            </div>
            <div style={S.row2}>
              <div style={S.formGroup}>
                <label style={S.label}>Color</label>
                <input style={S.input} placeholder="Blanco, negro..." value={form.vehicle_color}
                  onChange={e => set('vehicle_color', e.target.value)} />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Placas</label>
                <input style={{ ...S.input, textTransform: 'uppercase' }} placeholder="ABC-123" value={form.vehicle_plates}
                  onChange={e => set('vehicle_plates', e.target.value.toUpperCase())} />
              </div>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Tipo de vehículo</label>
              <select style={S.select} value={form.vehicle_type} onChange={e => set('vehicle_type', e.target.value)}>
                <option value="sedan">Sedán</option>
                <option value="suv">SUV / Camioneta</option>
                <option value="pickup">Pick-up</option>
                <option value="deportivo">Deportivo</option>
                <option value="van">Van / Minivan</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Notas adicionales (opcional)</label>
              <textarea style={S.textarea} rows={3} placeholder="Instrucciones especiales, acceso, cuidados..."
                value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button style={S.btnSecondary} onClick={() => setStep(1)}>← Atrás</button>
              <button style={{ ...S.btnPrimary, opacity: step2Valid ? 1 : 0.5 }}
                disabled={!step2Valid} onClick={() => setStep(3)}>
                Revisar →
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: Confirmación */}
        {step === 3 && (
          <>
            <div style={S.card}>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: '#111', marginBottom: 16 }}>
                ✅ Confirma tu traslado
              </div>

              <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '14px', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 1, marginBottom: 8, fontFamily: 'Montserrat, sans-serif' }}>RUTA</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 4 }}>📍 {form.pickup_location}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>🏁 {form.dropoff_location}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>
                  {new Date(form.trip_date).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  {form.trip_time && ` · ${form.trip_time}`}
                </div>
              </div>

              <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '14px', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 1, marginBottom: 8, fontFamily: 'Montserrat, sans-serif' }}>VEHÍCULO</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 4 }}>
                  {form.vehicle_brand} {form.vehicle_model} · {form.vehicle_color}
                </div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>Placas: {form.vehicle_plates}</div>
              </div>

              {form.notes && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: '#92400E' }}>📝 {form.notes}</div>
                </div>
              )}

              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>
                  ✓ Un conductor certificado será asignado y recibirás notificación de confirmación.
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px', marginBottom: 14, color: '#DC2626', fontSize: 13 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button style={S.btnSecondary} onClick={() => setStep(2)} disabled={loading}>← Editar</button>
                <button style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Enviando...' : 'Confirmar 🚀'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function MisViajesScreen({
  trips, onDetalle
}: {
  trips: Trip[];
  onDetalle: (t: Trip) => void;
}) {
  const [filtro, setFiltro] = useState<'todos' | 'activos' | 'completados'>('todos');

  const filtrados = trips.filter(t => {
    if (filtro === 'activos')     return !['completed', 'cancelled'].includes(t.status);
    if (filtro === 'completados') return t.status === 'completed';
    return true;
  });

  return (
    <>
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: '#fff', fontSize: 20 }}>Mis traslados</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>{trips.length} viajes totales</div>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['todos', 'activos', 'completados'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700,
              fontFamily: 'Montserrat, sans-serif', cursor: 'pointer', border: 'none',
              background: filtro === f ? '#FFC400' : 'rgba(255,255,255,0.1)',
              color: filtro === f ? '#151515' : 'rgba(255,255,255,0.6)',
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...S.content, paddingTop: 16 }}>
        {filtrados.length === 0 ? (
          <div style={S.emptyState}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ color: '#6B7280', fontSize: 14 }}>No hay viajes en esta categoría.</div>
          </div>
        ) : (
          filtrados.map(t => (
            <div key={t.id} style={{ ...S.card, cursor: 'pointer', borderLeft: `3px solid ${STATUS_COLOR[t.status] || '#E5E7EB'}` }}
              onClick={() => onDetalle(t)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1, marginRight: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 3 }}>
                    {t.pickup_location}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>→ {t.dropoff_location}</div>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#9CA3AF' }}>
                <span>🚗 {t.vehicle_brand} {t.vehicle_model}</span>
                <span>📅 {new Date(t.trip_date).toLocaleDateString('es-MX')}</span>
              </div>
              {!['completed', 'cancelled'].includes(t.status) && (
                <TripProgress status={t.status} />
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}

function DetalleScreen({ trip, onBack }: { trip: Trip; onBack: () => void }) {
  const activo = !['completed', 'cancelled'].includes(trip.status);

  return (
    <>
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={S.btnGhost} onClick={onBack}>
          <span style={{ fontSize: 22, color: '#fff' }}>←</span>
        </button>
        <div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: '#fff', fontSize: 17 }}>
            Detalle del viaje
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            {trip.id.slice(0, 8).toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ ...S.content, paddingTop: 20 }}>

        {/* Estado y progreso */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: '#111' }}>
              Estado del traslado
            </div>
            <StatusBadge status={trip.status} />
          </div>
          <TripProgress status={trip.status} />
        </div>

        {/* Ruta */}
        <div style={S.card}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, color: '#111', marginBottom: 14 }}>
            📍 Ruta
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', marginTop: 3, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>Origen</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{trip.pickup_location}</div>
              </div>
            </div>
            <div style={{ width: 1, height: 16, background: '#E5E7EB', marginLeft: 4 }} />
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFC400', marginTop: 3, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>Destino</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{trip.dropoff_location}</div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #F3F4F6', fontSize: 12, color: '#6B7280' }}>
            📅 {new Date(trip.trip_date).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {trip.trip_time && ` · ${trip.trip_time}`}
          </div>
        </div>

        {/* Vehículo */}
        <div style={S.card}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, color: '#111', marginBottom: 14 }}>
            🚗 Vehículo
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Marca', value: trip.vehicle_brand },
              { label: 'Modelo', value: trip.vehicle_model },
              { label: 'Color', value: trip.vehicle_color },
              { label: 'Placas', value: trip.vehicle_plates },
            ].filter(i => i.value).map(item => (
              <div key={item.label}>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Conductor asignado */}
        {trip.driver_email && (
          <div style={S.card}>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, color: '#111', marginBottom: 10 }}>
              👤 Conductor asignado
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, background: '#151515', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                🧑‍✈️
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Conductor Ruum Ruum</div>
                <div style={{ fontSize: 12, color: '#10B981' }}>✓ Certificado · Verificado</div>
              </div>
            </div>
          </div>
        )}

        {/* Notas */}
        {trip.notes && (
          <div style={{ ...S.card, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <div style={{ fontSize: 12, color: '#92400E' }}>📝 {trip.notes}</div>
          </div>
        )}

        {/* Evidencia check si completado */}
        {trip.status === 'completed' && trip.vehicle_check && (
          <div style={{ ...S.card, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, color: '#166534', marginBottom: 8 }}>
              ✅ Evidencia de entrega disponible
            </div>
            <div style={{ fontSize: 12, color: '#15803D' }}>
              El conductor documentó el estado del vehículo al inicio y al cierre del traslado.
            </div>
          </div>
        )}

        {/* Acción si activo */}
        {activo && (
          <div style={{ ...S.card, background: '#151515' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
              Tu traslado está siendo atendido. Recibirás actualizaciones en tiempo real.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ ...S.btnPrimary, fontSize: 13 }}>
                📞 Contactar soporte
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function PerfilScreen({ profile, onSignOut }: { profile: { full_name?: string; email: string; phone?: string }; onSignOut: () => void }) {
  return (
    <>
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: '#fff', fontSize: 20 }}>Mi perfil</div>
      </div>

      <div style={{ ...S.content, paddingTop: 20 }}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, ...S.card }}>
          <div style={{ width: 60, height: 60, background: '#FFC400', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 22, color: '#151515' }}>
            {(profile.full_name || profile.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18, color: '#111' }}>
              {profile.full_name || 'Cliente'}
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{profile.email}</div>
            <div style={{ marginTop: 6 }}>
              <span style={{ background: '#F0FDF4', color: '#16A34A', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999 }}>
                ✓ Cliente verificado
              </span>
            </div>
          </div>
        </div>

        {/* Datos */}
        <div style={S.card}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, color: '#111', marginBottom: 14 }}>
            Información de cuenta
          </div>
          {[
            { label: 'Nombre completo', value: profile.full_name || '—' },
            { label: 'Correo electrónico', value: profile.email },
            { label: 'Teléfono', value: profile.phone || 'No registrado' },
          ].map(item => (
            <div key={item.label} style={{ paddingBottom: 12, borderBottom: '1px solid #F3F4F6', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 14, color: '#111' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Info Ruum Ruum */}
        <div style={{ ...S.card, background: '#151515' }}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, color: '#FFC400', marginBottom: 10 }}>
            Ruum Ruum · MoviliaX
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
            Traslado vehicular certificado con evidencia digital y conductores verificados.
          </div>
          <a href="https://ruum-ruum.online" style={{ display: 'block', marginTop: 10, fontSize: 12, color: '#FFC400', textDecoration: 'none' }}>
            ruum-ruum.online ↗
          </a>
        </div>

        {/* Cerrar sesión */}
        <button onClick={onSignOut} style={{ ...S.btnSecondary, color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)', marginTop: 8 }}>
          Cerrar sesión
        </button>
      </div>
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ClientePage() {
  return (
    <RoleGate allowed={['cliente']}>
      <ClienteContent />
    </RoleGate>
  );
}

function ClienteContent() {
  const { profile, loading, signOut } = useAuth();
  const [screen, setScreen]           = useState<Screen>('home');
  const [trips, setTrips]             = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const fetchTrips = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('trips')
      .select('*')
      .eq('client_email', profile.email)
      .order('created_at', { ascending: false })
      .limit(100);
    setTrips((data as Trip[]) ?? []);
  }, [profile]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  // Tiempo real: escuchar cambios en los viajes del cliente
  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel('client-trips')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
        fetchTrips();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile, fetchTrips]);

  if (loading) return <LoadingScreen />;
  if (!profile) return <NoSession />;

  const navItems = [
    { id: 'home' as Screen,       icon: '🏠', label: 'Inicio' },
    { id: 'solicitar' as Screen,  icon: '➕', label: 'Solicitar' },
    { id: 'mis-viajes' as Screen, icon: '🚗', label: 'Mis viajes' },
    { id: 'perfil' as Screen,     icon: '👤', label: 'Perfil' },
  ];

  const handleDetalleViaje = (t: Trip) => {
    setSelectedTrip(t);
    setScreen('detalle');
  };

  const handleSolicitarSuccess = () => {
    fetchTrips();
    setScreen('mis-viajes');
  };

  return (
    <div style={S.page}>
      {/* Topbar */}
      <div style={S.topbar}>
        <div style={S.topbarRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={S.logo}>RR</div>
            <div>
              <div style={S.brandName}>Ruum Ruum</div>
              <div style={S.brandSub}>Cliente</div>
            </div>
          </div>
          <button style={S.signOutBtn} onClick={signOut}>Salir</button>
        </div>
      </div>

      {/* Pantallas */}
      {screen === 'home' && (
        <HomeScreen
          profile={profile}
          trips={trips}
          onSolicitar={() => setScreen('solicitar')}
          onDetalleViaje={handleDetalleViaje}
        />
      )}

      {screen === 'solicitar' && (
        <SolicitarScreen
          onBack={() => setScreen('home')}
          clientEmail={profile.email}
          clientName={profile.full_name || ''}
          onSuccess={handleSolicitarSuccess}
        />
      )}

      {screen === 'mis-viajes' && (
        <MisViajesScreen trips={trips} onDetalle={handleDetalleViaje} />
      )}

      {screen === 'detalle' && selectedTrip && (
        <DetalleScreen
          trip={selectedTrip}
          onBack={() => setScreen('mis-viajes')}
        />
      )}

      {screen === 'perfil' && (
        <PerfilScreen profile={profile} onSignOut={signOut} />
      )}

      {/* Nav inferior */}
      <nav style={S.nav}>
        {navItems.map(item => {
          const active = screen === item.id || (screen === 'detalle' && item.id === 'mis-viajes');
          return (
            <button key={item.id} style={S.navItem} onClick={() => setScreen(item.id)}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ ...S.navLabel, color: active ? '#151515' : '#9CA3AF' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
