'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/supabase';
import {
  CheckCircle2, Navigation, MapPin, Car, Truck, Flag,
  Phone, ExternalLink, Loader2, Plus, X,
  Camera, Gauge, Fuel, Key, FileText, ChevronRight
} from 'lucide-react';

const FLOW_STEPS = [
  { status: 'accepted',       nextStatus: 'in_progress',    cta: 'En camino a recogida',  icon: '🧭' },
  { status: 'in_progress',    nextStatus: 'pickup_arrived', cta: 'Llegué a recogida',      icon: '📍' },
  { status: 'pickup_arrived', nextStatus: 'vehicle_picked', cta: 'Vehículo recogido',      icon: '🚗' },
  { status: 'vehicle_picked', nextStatus: 'delivering',     cta: 'Iniciar entrega',        icon: '🚚' },
  { status: 'delivering',     nextStatus: 'completed',      cta: 'Entregado ✓',            icon: '🏁' },
];

const STATUS_LABELS: Record<string, string> = {
  accepted:       'Aceptado',
  in_progress:    'En camino',
  pickup_arrived: 'En recogida',
  vehicle_picked: 'Vehículo en mano',
  delivering:     'En entrega',
  completed:      'Completado',
};

const REQUIRED_PHOTOS = [
  { key: 'front',          label: 'Frente',            icon: '🚗' },
  { key: 'driver_side',    label: 'Lado conductor',    icon: '🚪' },
  { key: 'passenger_side', label: 'Lado copiloto',     icon: '🚪' },
  { key: 'rear',           label: 'Parte trasera',     icon: '🔙' },
  { key: 'dashboard',      label: 'Tablero / interior',icon: '🎛️' },
];

interface Trip {
  id: string;
  status: string;
  pickup_location: string;
  dropoff_location: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_plates?: string;
  client_name?: string;
  client_phone?: string;
  earnings?: number;
  vehicle_check?: Record<string, unknown>;
}

interface Props {
  trip: Trip | null;
  open: boolean;
  onClose: () => void;
  onTripUpdated: () => void;
}

// ── Vehicle Check Modal ────────────────────────────────────────
function VehicleCheckModal({ open, onClose, onComplete }: {
  open: boolean; onClose: () => void;
  onComplete: (data: Record<string, unknown>) => void;
}) {
  const [photos, setPhotos]           = useState<Record<string, string>>({});
  const [uploading, setUploading]     = useState<Record<string, boolean>>({});
  const [extraPhotos, setExtraPhotos] = useState<{ key: string; url: string }[]>([]);
  const [saving, setSaving]           = useState(false);
  const [form, setForm]               = useState({ mileage: '', fuel_level: '', keys: '', notes: '' });

  const handleUpload = async (key: string, file: File) => {
    setUploading(p => ({ ...p, [key]: true }));
    const url = await uploadFile(file, 'vehicle-checks');
    setPhotos(p => ({ ...p, [key]: url }));
    setUploading(p => ({ ...p, [key]: false }));
  };

  const handleExtraPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const key = `extra_${Date.now()}`;
    setUploading(p => ({ ...p, [key]: true }));
    const url = await uploadFile(file, 'vehicle-checks');
    setExtraPhotos(p => [...p, { key, url }]);
    setUploading(p => ({ ...p, [key]: false }));
    e.target.value = '';
  };

  const requiredDone  = REQUIRED_PHOTOS.every(p => photos[p.key]);
  const anyUploading  = Object.values(uploading).some(Boolean);

  const handleComplete = async () => {
    if (!requiredDone) { alert('Completa todas las fotos requeridas'); return; }
    setSaving(true);
    await onComplete({ photos, extra_photos: extraPhotos.map(p => p.url), ...form });
    setSaving(false);
  };

  if (!open) return null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', padding:'24px 20px 32px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <span style={{ fontSize:20 }}>📷</span>
          <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:16 }}>Check de vehículo</span>
        </div>
        <p style={{ fontSize:12, color:'#9ca3af', marginBottom:20 }}>Documenta el estado del vehículo antes de iniciar el traslado</p>

        {/* Fotos requeridas */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
            <span style={{ fontSize:13, fontWeight:600 }}>Fotos requeridas</span>
            <span style={{ fontSize:12, color:'#9ca3af' }}>{Object.keys(photos).length}/{REQUIRED_PHOTOS.length}</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {REQUIRED_PHOTOS.map(p => {
              const done = !!photos[p.key];
              const busy = uploading[p.key];
              return (
                <label key={p.key} style={{ position:'relative', minHeight:90, border:`2px dashed ${done ? '#22c55e' : '#e5e7eb'}`, borderRadius:12, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, cursor:'pointer', overflow:'hidden', background: done ? '#f0fdf4' : '#fafafa' }}>
                  {done ? (
                    <>
                      <img src={photos[p.key]} alt={p.label} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>
                      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.3)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                        <span style={{ fontSize:18 }}>✅</span>
                        <span style={{ fontSize:10, color:'#fff', fontWeight:600 }}>{p.label}</span>
                      </div>
                    </>
                  ) : busy ? (
                    <span style={{ fontSize:12, color:'#9ca3af' }}>Subiendo...</span>
                  ) : (
                    <>
                      <span style={{ fontSize:24 }}>{p.icon}</span>
                      <span style={{ fontSize:11, color:'#6b7280', textAlign:'center', padding:'0 4px' }}>{p.label}</span>
                      <span style={{ fontSize:18 }}>📷</span>
                    </>
                  )}
                  <input type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e => handleUpload(p.key, e.target.files![0])}/>
                </label>
              );
            })}
            <label style={{ minHeight:90, border:'2px dashed #e5e7eb', borderRadius:12, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, cursor:'pointer', background:'#fafafa' }}>
              <span style={{ fontSize:20 }}>➕</span>
              <span style={{ fontSize:11, color:'#9ca3af' }}>Extra</span>
              <input type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={handleExtraPhoto}/>
            </label>
          </div>
          {extraPhotos.length > 0 && (
            <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
              {extraPhotos.map(p => (
                <div key={p.key} style={{ position:'relative', width:64, height:64, borderRadius:8, overflow:'hidden' }}>
                  <img src={p.url} alt="extra" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  <button onClick={() => setExtraPhotos(prev => prev.filter(x => x.key !== p.key))} style={{ position:'absolute', top:2, right:2, background:'rgba(0,0,0,0.6)', border:'none', borderRadius:'50%', width:18, height:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Datos del vehículo */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Datos en recogida</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            {[
              { label:'Kilometraje', key:'mileage', placeholder:'Ej: 45230', icon:'🔢' },
              { label:'Combustible', key:'fuel_level', placeholder:'Ej: 1/2, lleno', icon:'⛽' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize:11, color:'#6b7280', display:'block', marginBottom:4 }}>{f.icon} {f.label}</label>
                <input value={form[f.key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                  style={{ width:'100%', border:'0.5px solid #e5e7eb', borderRadius:8, padding:'8px 10px', fontSize:13, outline:'none', boxSizing:'border-box' }}/>
              </div>
            ))}
          </div>
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:11, color:'#6b7280', display:'block', marginBottom:4 }}>🔑 Llaves entregadas</label>
            <input value={form.keys} onChange={e => setForm(p => ({ ...p, keys: e.target.value }))} placeholder="Ej: 1 llave principal, 1 control"
              style={{ width:'100%', border:'0.5px solid #e5e7eb', borderRadius:8, padding:'8px 10px', fontSize:13, outline:'none', boxSizing:'border-box' }}/>
          </div>
          <div>
            <label style={{ fontSize:11, color:'#6b7280', display:'block', marginBottom:4 }}>📝 Notas</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Daños preexistentes, observaciones..." rows={3}
              style={{ width:'100%', border:'0.5px solid #e5e7eb', borderRadius:8, padding:'8px 10px', fontSize:13, outline:'none', resize:'none', boxSizing:'border-box' }}/>
          </div>
        </div>

        <button onClick={handleComplete} disabled={!requiredDone || anyUploading || saving}
          style={{ width:'100%', background: (!requiredDone || anyUploading || saving) ? '#9ca3af' : '#FFC400', color:'#151515', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:14, padding:'14px', border:'none', borderRadius:8, cursor: (!requiredDone || anyUploading || saving) ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          {saving ? 'Guardando...' : '✅ Confirmar recogida'}
        </button>
        {!requiredDone && <p style={{ fontSize:11, color:'#9ca3af', textAlign:'center', marginTop:8 }}>Faltan {REQUIRED_PHOTOS.filter(p => !photos[p.key]).length} foto(s)</p>}

        <button onClick={onClose} style={{ width:'100%', background:'transparent', border:'none', color:'#9ca3af', fontSize:13, marginTop:12, cursor:'pointer' }}>Cancelar</button>
      </div>
    </div>
  );
}

// ── Expense Modal (inline simple) ─────────────────────────────
function ExpenseModal({ open, onClose, tripId, driverEmail }: {
  open: boolean; onClose: () => void; tripId: string; driverEmail: string;
}) {
  const [form, setForm] = useState({ category: 'gasolina', amount: '', description: '', deductible: false });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.amount) return;
    setSaving(true);
    await supabase.from('expenses').insert({
      trip_id: tripId,
      driver_email: driverEmail,
      category: form.category,
      amount: parseFloat(form.amount),
      description: form.description,
      deductible: form.deductible,
      expense_date: new Date().toISOString().slice(0, 10),
    });
    setSaving(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1100, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:520, padding:'24px 20px 32px' }}>
        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:16, marginBottom:16 }}>💸 Registrar gasto</div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11, color:'#6b7280', display:'block', marginBottom:4 }}>Categoría</label>
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            style={{ width:'100%', border:'0.5px solid #e5e7eb', borderRadius:8, padding:'8px 10px', fontSize:13, outline:'none' }}>
            {['caseta','gasolina','lavado','estacionamiento','otro'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11, color:'#6b7280', display:'block', marginBottom:4 }}>Monto (MXN)</label>
          <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00"
            style={{ width:'100%', border:'0.5px solid #e5e7eb', borderRadius:8, padding:'8px 10px', fontSize:13, outline:'none', boxSizing:'border-box' }}/>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:11, color:'#6b7280', display:'block', marginBottom:4 }}>Descripción (opcional)</label>
          <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Caseta Querétaro..."
            style={{ width:'100%', border:'0.5px solid #e5e7eb', borderRadius:8, padding:'8px 10px', fontSize:13, outline:'none', boxSizing:'border-box' }}/>
        </div>
        <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, marginBottom:16, cursor:'pointer' }}>
          <input type="checkbox" checked={form.deductible} onChange={e => setForm(p => ({ ...p, deductible: e.target.checked }))}/>
          Deducible
        </label>
        <button onClick={handleSave} disabled={saving}
          style={{ width:'100%', background:'#FFC400', color:'#151515', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:14, padding:'12px', border:'none', borderRadius:8, cursor:'pointer' }}>
          {saving ? 'Guardando...' : 'Guardar gasto'}
        </button>
        <button onClick={onClose} style={{ width:'100%', background:'transparent', border:'none', color:'#9ca3af', fontSize:13, marginTop:10, cursor:'pointer' }}>Cancelar</button>
      </div>
    </div>
  );
}

// ── TripFlowManager principal ──────────────────────────────────
export default function TripFlowManager({ trip, open, onClose, onTripUpdated }: Props) {
  const [loading, setLoading]               = useState(false);
  const [showExpense, setShowExpense]        = useState(false);
  const [showVehicleCheck, setShowVehicleCheck] = useState(false);

  if (!trip || !open) return null;

  const stepIndex        = FLOW_STEPS.findIndex(s => s.status === trip.status);
  const currentFlowStep  = FLOW_STEPS[stepIndex];
  const isCompleted      = trip.status === 'completed';

  const openNavigation = (dest: string) => {
    window.open(`https://waze.com/ul?q=${encodeURIComponent(dest)}`, '_blank');
  };

  const advanceStatus = async (checkData?: Record<string, unknown>) => {
    if (!currentFlowStep) return;
    if (trip.status === 'pickup_arrived' && !checkData) {
      setShowVehicleCheck(true);
      return;
    }
    setLoading(true);
    const payload: Record<string, unknown> = { status: currentFlowStep.nextStatus };
    if (checkData) payload.vehicle_check = checkData;
    await supabase.from('trips').update(payload).eq('id', trip.id);
    onTripUpdated();
    if (currentFlowStep.nextStatus === 'completed') onClose();
    setLoading(false);
  };

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:500, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={onClose}>
        <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', padding:'24px 20px 32px' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:18 }}>Gestión del viaje</div>
              <span style={{ fontSize:12, background:'#dbeafe', color:'#1e40af', padding:'3px 10px', borderRadius:6, display:'inline-block', marginTop:4 }}>
                {STATUS_LABELS[trip.status] ?? trip.status}
              </span>
            </div>
            {(trip.earnings ?? 0) > 0 && (
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:26, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'#FFC400' }}>${trip.earnings?.toLocaleString()}</div>
                <div style={{ fontSize:11, color:'#9ca3af' }}>Tarifa fija</div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ display:'flex', gap:4, marginBottom:20 }}>
            {FLOW_STEPS.map((s, i) => (
              <div key={s.status} style={{ flex:1, height:6, borderRadius:3, background: i < stepIndex ? '#22c55e' : i === stepIndex ? '#FFC400' : '#e5e7eb', transition:'background 0.3s' }}/>
            ))}
          </div>

          {/* Ruta */}
          <div style={{ background:'#f9fafb', borderRadius:12, padding:'14px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'#22c55e', flexShrink:0, marginTop:4 }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:'#9ca3af' }}>Recogida</div>
                <div style={{ fontSize:13, fontWeight:500 }}>{trip.pickup_location}</div>
              </div>
              <button onClick={() => openNavigation(trip.pickup_location)} style={{ background:'#eff6ff', border:'none', borderRadius:8, padding:'6px', cursor:'pointer' }}>
                <span style={{ fontSize:14 }}>🗺️</span>
              </button>
            </div>
            <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'#FFC400', flexShrink:0, marginTop:4 }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:'#9ca3af' }}>Entrega</div>
                <div style={{ fontSize:13, fontWeight:500 }}>{trip.dropoff_location}</div>
              </div>
              <button onClick={() => openNavigation(trip.dropoff_location)} style={{ background:'#eff6ff', border:'none', borderRadius:8, padding:'6px', cursor:'pointer' }}>
                <span style={{ fontSize:14 }}>🗺️</span>
              </button>
            </div>
          </div>

          {/* Info vehículo */}
          {(trip.vehicle_brand || trip.vehicle_plates) && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
              {trip.vehicle_brand && <div style={{ background:'#f9fafb', borderRadius:10, padding:'10px 12px' }}><div style={{ fontSize:11, color:'#9ca3af' }}>Vehículo</div><div style={{ fontSize:13, fontWeight:600 }}>{trip.vehicle_brand} {trip.vehicle_model}</div></div>}
              {trip.vehicle_plates && <div style={{ background:'#f9fafb', borderRadius:10, padding:'10px 12px' }}><div style={{ fontSize:11, color:'#9ca3af' }}>Placas</div><div style={{ fontSize:13, fontWeight:600 }}>{trip.vehicle_plates}</div></div>}
              {trip.vehicle_color && <div style={{ background:'#f9fafb', borderRadius:10, padding:'10px 12px' }}><div style={{ fontSize:11, color:'#9ca3af' }}>Color</div><div style={{ fontSize:13, fontWeight:600 }}>{trip.vehicle_color}</div></div>}
              {trip.client_phone && (
                <a href={`tel:${trip.client_phone}`} style={{ background:'#f0fdf4', borderRadius:10, padding:'10px 12px', textDecoration:'none', display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:16 }}>📞</span>
                  <div><div style={{ fontSize:11, color:'#9ca3af' }}>Cliente</div><div style={{ fontSize:13, fontWeight:600, color:'#151515' }}>{trip.client_name}</div></div>
                </a>
              )}
            </div>
          )}

          {/* Navegación */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
            <button onClick={() => openNavigation(stepIndex < 3 ? trip.pickup_location : trip.dropoff_location)}
              style={{ padding:'10px', border:'0.5px solid #e5e7eb', borderRadius:10, background:'#fff', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              🧭 Waze
            </button>
            <button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(stepIndex < 3 ? trip.pickup_location : trip.dropoff_location)}`, '_blank')}
              style={{ padding:'10px', border:'0.5px solid #e5e7eb', borderRadius:10, background:'#fff', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              📍 Maps
            </button>
          </div>

          {/* Registrar gasto */}
          {!isCompleted && (
            <button onClick={() => setShowExpense(true)}
              style={{ width:'100%', padding:'10px', border:'1.5px dashed #e5e7eb', borderRadius:10, background:'#fff', cursor:'pointer', fontSize:13, marginBottom:12, display:'flex', alignItems:'center', justifyContent:'center', gap:6, color:'#6b7280' }}>
              ➕ Registrar gasto
            </button>
          )}

          {/* CTA principal */}
          {currentFlowStep && !isCompleted && (
            <button onClick={() => advanceStatus()} disabled={loading}
              style={{ width:'100%', background: loading ? '#9ca3af' : '#FFC400', color:'#151515', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:15, padding:'14px', border:'none', borderRadius:10, cursor: loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {loading ? '⏳ Actualizando...' : <><span>{currentFlowStep.icon}</span> {currentFlowStep.cta}</>}
            </button>
          )}

          {isCompleted && (
            <div style={{ background:'#f0fdf4', borderRadius:12, padding:'20px', textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'#166534', fontSize:16 }}>Viaje completado</div>
              <div style={{ fontSize:13, color:'#9ca3af', marginTop:4 }}>Ganaste ${trip.earnings?.toLocaleString()}</div>
            </div>
          )}

          <button onClick={onClose} style={{ width:'100%', background:'transparent', border:'none', color:'#9ca3af', fontSize:13, marginTop:12, cursor:'pointer' }}>Cerrar</button>
        </div>
      </div>

      <VehicleCheckModal
        open={showVehicleCheck}
        onClose={() => setShowVehicleCheck(false)}
        onComplete={async (data) => { setShowVehicleCheck(false); await advanceStatus(data); }}
      />

      <ExpenseModal
        open={showExpense}
        onClose={() => setShowExpense(false)}
        tripId={trip.id}
        driverEmail={''}
      />
    </>
  );
}
