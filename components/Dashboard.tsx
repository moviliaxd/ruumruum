'use client';

/**
 * Dashboard Maestro — Ruum Ruum
 * Conectado directamente a Supabase
 *
 * Entidades: Trip, DriverDocument, Expense, Message, SupportMessage, Profile
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase, Trip, DriverDocument, Expense, Message, SupportMessage, Profile } from '@/lib/supabase';


// ── Tipos ──────────────────────────────────────────────────────
type TripStatus = Trip['status'];
type TripType = Trip['trip_type'];
type User = Profile;

// ── Config de estados ──────────────────────────────────────────
const TRIP_STATUS: Record<TripStatus, { label: string; dot: string; bg: string; text: string }> = {
  requested:      { label: 'Solicitado',    dot: '#f59e0b', bg: '#fef9c3', text: '#854d0e' },
  accepted:       { label: 'Aceptado',      dot: '#8b5cf6', bg: '#ede9fe', text: '#5b21b6' },
  in_progress:    { label: 'En progreso',   dot: '#3b82f6', bg: '#dbeafe', text: '#1e40af' },
  pickup_arrived: { label: 'En recogida',   dot: '#06b6d4', bg: '#cffafe', text: '#164e63' },
  vehicle_picked: { label: 'Vehículo tomado', dot: '#6366f1', bg: '#e0e7ff', text: '#3730a3' },
  delivering:     { label: 'En camino',     dot: '#0ea5e9', bg: '#e0f2fe', text: '#0c4a6e' },
  completed:      { label: 'Completado',    dot: '#22c55e', bg: '#dcfce7', text: '#166534' },
  cancelled:      { label: 'Cancelado',     dot: '#ef4444', bg: '#fee2e2', text: '#991b1b' },
};

const DOC_STATUS = {
  pending:  { label: 'Pendiente', bg: '#fef9c3', text: '#854d0e' },
  approved: { label: 'Aprobado',  bg: '#dcfce7', text: '#166534' },
  rejected: { label: 'Rechazado', bg: '#fee2e2', text: '#991b1b' },
};

// ── Helpers ────────────────────────────────────────────────────
const MXN = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
const initials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
const reltime  = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'ahora';
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
};
const fmtDate  = (d?: string) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};
const daysUntil = (d: string) => Math.floor((new Date(d).getTime() - Date.now()) / 86400000);

// ── Badge ──────────────────────────────────────────────────────
function Badge({ bg, text, label }: { bg: string; text: string; label: string }) {
  return (
    <span style={{ background: bg, color: text, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4 }}>
      {label}
    </span>
  );
}

// ── Componente principal ───────────────────────────────────────
export default function Dashboard() {
  const [trips, setTrips]       = useState<Trip[]>([]);
  const [docs, setDocs]         = useState<DriverDocument[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [support, setSupport]   = useState<SupportMessage[]>([]);
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [tab, setTab]           = useState<'overview'|'trips'|'drivers'|'finances'|'support'>('overview');
  const [clock, setClock]       = useState('');
  const [tripFilter, setTripFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [tripsRes, docsRes, expensesRes, messagesRes, supportRes, usersRes] = await Promise.all([
        supabase.from('trips').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('driver_documents').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('expenses').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('support_messages').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('profiles').select('*').limit(100),
      ]);

      if (tripsRes.error || docsRes.error || expensesRes.error || messagesRes.error || supportRes.error || usersRes.error) {
        throw new Error(
          tripsRes.error?.message || docsRes.error?.message || expensesRes.error?.message ||
          messagesRes.error?.message || supportRes.error?.message || usersRes.error?.message ||
          'Error al cargar datos'
        );
      }

      setTrips(tripsRes.data as Trip[]);
      setDocs(docsRes.data as DriverDocument[]);
      setExpenses(expensesRes.data as Expense[]);
      setMessages(messagesRes.data as Message[]);
      setSupport(supportRes.data as SupportMessage[]);
      setUsers(usersRes.data as User[]);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Error al cargar datos. Verifica tu conexión.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Métricas ─────────────────────────────────────────────────
  const active      = trips.filter(t => ['in_progress','pickup_arrived','vehicle_picked','delivering'].includes(t.status));
  const pending     = trips.filter(t => ['requested','accepted'].includes(t.status));
  const completed   = trips.filter(t => t.status === 'completed');
  const totalEarnings = trips.filter(t => t.status === 'completed').reduce((s, t) => s + (t.earnings ?? 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const unreadSupport = support.filter(s => !s.read && s.role === 'driver');
  const urgentSupport = support.filter(s => s.urgency === 'urgent' && !s.read);

  // Docs por vencer (< 30 días)
  const expiringDocs = docs.filter(d => {
    if (!d.expiry_date) return false;
    const days = daysUntil(d.expiry_date);
    return days >= 0 && days <= 30;
  });
  const pendingDocs = docs.filter(d => d.status === 'pending');

  // Conductores únicos desde trips + perfiles de conductores
  const driverEmails = [...new Set([
    ...trips.filter(t => t.driver_email).map(t => t.driver_email!),
    ...users.filter(u => u.role === 'conductor').map(u => u.email),
  ])];

  const filteredTrips = tripFilter === 'all' ? trips : trips.filter(t => t.status === tripFilter);

  // ── Render ───────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#F8F8F5', flexDirection:'column', gap:16 }}>
      <div style={{ width:48, height:48, background:'#FFC400', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:18, color:'#151515' }}>RR</div>
      <div style={{ fontSize:14, color:'#6b7280' }}>Conectando con Supabase…</div>
    </div>
  );

  if (error) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#F8F8F5', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:14, color:'#ef4444', maxWidth:400, textAlign:'center' }}>{error}</div>
      <button onClick={loadData} style={{ background:'#FFC400', border:'none', padding:'10px 24px', fontWeight:700, cursor:'pointer', fontSize:13 }}>Reintentar</button>
    </div>
  );

  return (
    <div style={{ fontFamily:'Inter,system-ui,sans-serif', background:'#F8F8F5', minHeight:'100vh' }}>

      {/* HEADER */}
      <div style={{ background:'#151515', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, background:'#FFC400', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, color:'#151515', letterSpacing:-1 }}>RR</div>
          <div>
            <div style={{ color:'#fff', fontWeight:600, fontSize:15 }}>Tablero maestro</div>
            <div style={{ color:'#FFC400', fontSize:10, letterSpacing:2, textTransform:'uppercase' }}>Ruum Ruum · MoviliaX</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'rgba(255,255,255,0.5)' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#4ade80', animation:'pulse 2s infinite' }}/>
            Conectado
          </div>
          {lastUpdated && <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11 }}>actualizado {reltime(lastUpdated.toISOString())}</div>}
          <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>{clock}</div>
          <button onClick={loadData} style={{ background:'rgba(255,196,0,0.15)', border:'1px solid rgba(255,196,0,0.3)', color:'#FFC400', fontSize:12, padding:'6px 14px', cursor:'pointer' }}>
            ↻ Actualizar
          </button>
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      </div>

      {/* TABS */}
      <div style={{ background:'#fff', borderBottom:'0.5px solid rgba(0,0,0,0.08)', display:'flex', padding:'0 24px', overflowX:'auto' }}>
        {([
          { key:'overview',  label:'Resumen' },
          { key:'trips',     label:`Viajes (${trips.length})` },
          { key:'drivers',   label:`Conductores (${driverEmails.length})` },
          { key:'finances',  label:'Finanzas' },
          { key:'support',   label:`Soporte${unreadSupport.length > 0 ? ` (${unreadSupport.length})` : ''}` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding:'12px 18px', fontSize:13, background:'none', border:'none', whiteSpace:'nowrap',
            borderBottom: tab === t.key ? '2px solid #FFC400' : '2px solid transparent',
            color: tab === t.key ? '#151515' : '#6b7280',
            fontWeight: tab === t.key ? 600 : 400, cursor:'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding:'20px 24px' }}>

        {/* ── RESUMEN ── */}
        {tab === 'overview' && <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
            <MetricCard label="Total viajes"    value={trips.length}        sub={`${completed.length} completados`} subColor="#16a34a" />
            <MetricCard label="Activos ahora"   value={active.length}       sub="en tránsito"                       subColor="#2563eb" />
            <MetricCard label="Ganancias brutas" value={MXN(totalEarnings)} sub={`−${MXN(totalExpenses)} gastos`}   subColor="#6b7280" isText />
            <MetricCard label="Alertas"          value={urgentSupport.length + expiringDocs.length + pendingDocs.length}
                                                  sub="requieren atención"  subColor={urgentSupport.length > 0 ? '#d97706' : '#16a34a'} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Distribución de estados */}
            <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:12, padding:20 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:16 }}>Distribución de viajes</div>
              {Object.entries(TRIP_STATUS).map(([key, cfg]) => {
                const count = trips.filter(t => t.status === key).length;
                const pct   = trips.length ? Math.round(count / trips.length * 100) : 0;
                return (
                  <div key={key} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:9 }}>
                    <div style={{ width:88, fontSize:12, color:'#6b7280' }}>{cfg.label}</div>
                    <div style={{ flex:1, height:7, background:'#f3f4f6', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ width:`${pct}%`, height:'100%', background:cfg.dot, borderRadius:4, transition:'width 0.5s' }}/>
                    </div>
                    <div style={{ width:20, fontSize:12, fontWeight:600, color:'#111', textAlign:'right' }}>{count}</div>
                  </div>
                );
              })}
            </div>

            {/* Actividad reciente */}
            <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:12, padding:20 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:16 }}>Actividad reciente</div>
              {trips.slice(0, 7).map(t => {
                const cfg = TRIP_STATUS[t.status];
                return (
                  <div key={t.id} style={{ display:'flex', gap:10, paddingBottom:10, marginBottom:10, borderBottom:'0.5px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:cfg.dot, marginTop:5, flexShrink:0 }}/>
                    <div>
                      <div style={{ fontSize:12, color:'#111', lineHeight:1.4 }}>
                        {cfg.label} — {t.vehicle_brand ?? '—'} {t.vehicle_model ?? ''} {t.vehicle_plates ? `(${t.vehicle_plates})` : ''}
                      </div>
                      <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>
                        {t.pickup_location?.split(',')[0]} → {t.dropoff_location?.split(',')[0]}
                        {t.driver_email && ` · ${t.driver_email.split('@')[0]}`}
                        {t.created_at && ` · ${reltime(t.created_at)}`}
                      </div>
                    </div>
                    {t.earnings && <div style={{ fontSize:12, color:'#16a34a', marginLeft:'auto', whiteSpace:'nowrap' }}>{MXN(t.earnings)}</div>}
                  </div>
                );
              })}
              {trips.length === 0 && <div style={{ fontSize:13, color:'#9ca3af', textAlign:'center', paddingTop:20 }}>Sin viajes registrados</div>}
            </div>
          </div>
        </>}

        {/* ── VIAJES ── */}
        {tab === 'trips' && <>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:600 }}>Todos los viajes</div>
            <select value={tripFilter} onChange={e => setTripFilter(e.target.value)}
              style={{ fontSize:12, padding:'6px 10px', border:'0.5px solid rgba(0,0,0,0.15)', borderRadius:6, background:'#fff' }}>
              <option value="all">Todos los estados</option>
              {Object.entries(TRIP_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1fr 1fr 90px', gap:8, padding:'10px 16px', background:'#f9fafb', fontSize:11, color:'#6b7280', fontWeight:500 }}>
              <div>Ruta</div><div>Vehículo</div><div>Conductor</div><div>Fecha</div><div>Estado</div>
            </div>
            {filteredTrips.length === 0 && <div style={{ padding:32, textAlign:'center', color:'#9ca3af', fontSize:13 }}>Sin viajes</div>}
            {filteredTrips.map((t, i) => {
              const cfg = TRIP_STATUS[t.status];
              return (
                <div key={t.id} style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1fr 1fr 90px', gap:8, padding:'11px 16px', alignItems:'center', background: i%2===0?'#fff':'#fafafa', borderTop:'0.5px solid rgba(0,0,0,0.05)' }}>
                  <div>
                    <div style={{ fontSize:12, color:'#111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.pickup_location}</div>
                    <div style={{ fontSize:11, color:'#9ca3af', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>→ {t.dropoff_location}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:12, color:'#111' }}>{[t.vehicle_brand, t.vehicle_model].filter(Boolean).join(' ') || '—'}</div>
                    <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{t.vehicle_plates ?? t.vehicle_color ?? ''}</div>
                  </div>
                  <div style={{ fontSize:11, color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {t.driver_email ? t.driver_email.split('@')[0] : '—'}
                  </div>
                  <div style={{ fontSize:11, color:'#6b7280' }}>{fmtDate(t.trip_date)}</div>
                  <div><Badge bg={cfg.bg} text={cfg.text} label={cfg.label} /></div>
                </div>
              );
            })}
          </div>
        </>}

        {/* ── CONDUCTORES ── */}
        {tab === 'drivers' && <>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Conductores registrados</div>
          {driverEmails.length === 0 && (
            <div style={{ padding:32, textAlign:'center', color:'#9ca3af', fontSize:13, background:'#fff', borderRadius:12 }}>
              Sin conductores registrados
            </div>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {driverEmails.map(email => {
              const user = users.find(u => u.email === email);
              const name = user?.full_name ?? email.split('@')[0].replace(/[._]/g,' ').replace(/\b\w/g, c => c.toUpperCase());
              const driverTrips = trips.filter(t => t.driver_email === email);
              const driverDocs  = docs.filter(d => d.driver_email === email);
              const driverExp   = expenses.filter(e => e.driver_email === email);
              const activeTrip  = driverTrips.find(t => ['in_progress','delivering','pickup_arrived','vehicle_picked'].includes(t.status));
              const expDocs     = driverDocs.filter(d => d.expiry_date && daysUntil(d.expiry_date) <= 30 && daysUntil(d.expiry_date) >= 0);
              const earnings    = driverTrips.filter(t => t.status==='completed').reduce((s,t) => s+(t.earnings??0),0);
              const expAmount   = driverExp.reduce((s,e) => s+(e.amount??0),0);
              return (
                <div key={email} style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:42, height:42, borderRadius:'50%', background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600, color:'#1e40af', flexShrink:0 }}>
                    {initials(name)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:'#111' }}>{name}</div>
                    <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{email}</div>
                  </div>
                  <div style={{ textAlign:'center', fontSize:11, color:'#6b7280' }}>
                    <div style={{ fontSize:20, fontWeight:700, color:'#111' }}>{driverTrips.length}</div>viajes
                  </div>
                  <div style={{ textAlign:'center', fontSize:11, color:'#6b7280' }}>
                    <div style={{ fontSize:14, fontWeight:600, color:'#16a34a' }}>{MXN(earnings)}</div>ganancias
                  </div>
                  <div style={{ textAlign:'center', fontSize:11, color:'#6b7280' }}>
                    <div style={{ fontSize:14, fontWeight:600, color:'#ef4444' }}>{MXN(expAmount)}</div>gastos
                  </div>
                  <div style={{ textAlign:'center', fontSize:11, color:'#6b7280' }}>
                    <div style={{ fontSize:14, fontWeight:600, color:'#111' }}>{driverDocs.length}</div>docs
                  </div>
                  {expDocs.length > 0 && (
                    <Badge bg="#fffbeb" text="#854d0e" label={`Doc vence en ${daysUntil(expDocs[0].expiry_date!)}d`} />
                  )}
                  <Badge
                    bg={activeTrip ? '#dbeafe' : '#f3f4f6'}
                    text={activeTrip ? '#1e40af' : '#374151'}
                    label={activeTrip ? 'En viaje' : 'Disponible'}
                  />
                </div>
              );
            })}
          </div>

          {/* Documentos */}
          {docs.length > 0 && <>
            <div style={{ fontSize:14, fontWeight:600, margin:'24px 0 12px' }}>Documentos de conductores</div>
            <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:12, overflow:'hidden' }}>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1fr 1fr 80px', gap:8, padding:'10px 16px', background:'#f9fafb', fontSize:11, color:'#6b7280', fontWeight:500 }}>
                <div>Conductor</div><div>Documento</div><div>Vence</div><div>Estado</div><div>Archivo</div>
              </div>
              {docs.map((d, i) => {
                const st = DOC_STATUS[d.status ?? 'pending'];
                const days = d.expiry_date ? daysUntil(d.expiry_date) : null;
                return (
                  <div key={d.id} style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1fr 1fr 80px', gap:8, padding:'11px 16px', alignItems:'center', background:i%2===0?'#fff':'#fafafa', borderTop:'0.5px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize:12, color:'#111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.driver_email ?? '—'}</div>
                    <div style={{ fontSize:12, color:'#111' }}>{d.document_name}</div>
                    <div style={{ fontSize:11, color: days !== null && days <= 15 ? '#d97706' : '#6b7280' }}>
                      {d.expiry_date ? new Date(d.expiry_date).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                    </div>
                    <div><Badge bg={st.bg} text={st.text} label={st.label} /></div>
                    <div>
                      {d.file_url
                        ? <a href={d.file_url} target="_blank" style={{ fontSize:11, color:'#2563eb' }}>Ver archivo</a>
                        : <span style={{ fontSize:11, color:'#9ca3af' }}>—</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </>}
        </>}

        {/* ── FINANZAS ── */}
        {tab === 'finances' && <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
            <MetricCard label="Ganancias totales"  value={MXN(totalEarnings)}           sub={`${completed.length} viajes`}       subColor="#16a34a" isText />
            <MetricCard label="Gastos totales"      value={MXN(totalExpenses)}           sub={`${expenses.length} registros`}     subColor="#ef4444" isText />
            <MetricCard label="Neto estimado"       value={MXN(totalEarnings - totalExpenses)} sub="sin comisiones"              subColor="#2563eb" isText />
            <MetricCard label="Pagos pendientes"    value={trips.filter(t => t.payment_status === 'pending').length} sub="por cobrar" subColor="#d97706" />
          </div>

          {/* Gastos por categoría */}
          <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:16 }}>Gastos por categoría</div>
            {(['caseta','gasolina','lavado','estacionamiento','otro'] as const).map(cat => {
              const total = expenses.filter(e => e.category === cat).reduce((s,e) => s+e.amount, 0);
              const pct   = totalExpenses > 0 ? Math.round(total/totalExpenses*100) : 0;
              const colors: Record<string,string> = { caseta:'#f59e0b', gasolina:'#ef4444', lavado:'#3b82f6', estacionamiento:'#8b5cf6', otro:'#9ca3af' };
              return (
                <div key={cat} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                  <div style={{ width:96, fontSize:12, color:'#6b7280', textTransform:'capitalize' }}>{cat}</div>
                  <div style={{ flex:1, height:8, background:'#f3f4f6', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:colors[cat], borderRadius:4, transition:'width 0.5s' }}/>
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, color:'#111', minWidth:72, textAlign:'right' }}>{MXN(total)}</div>
                </div>
              );
            })}
          </div>

          {/* Lista gastos recientes */}
          <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'14px 16px', borderBottom:'0.5px solid rgba(0,0,0,0.06)', fontSize:13, fontWeight:600 }}>Gastos recientes</div>
            <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 1fr 80px', gap:8, padding:'10px 16px', background:'#f9fafb', fontSize:11, color:'#6b7280', fontWeight:500 }}>
              <div>Conductor</div><div>Categoría</div><div>Fecha</div><div>Monto</div><div>Deducible</div>
            </div>
            {expenses.slice(0, 20).map((e, i) => (
              <div key={e.id} style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 1fr 80px', gap:8, padding:'11px 16px', alignItems:'center', background:i%2===0?'#fff':'#fafafa', borderTop:'0.5px solid rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize:12, color:'#111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.driver_email?.split('@')[0] ?? '—'}</div>
                <div style={{ fontSize:12, color:'#111', textTransform:'capitalize' }}>{e.category}</div>
                <div style={{ fontSize:11, color:'#6b7280' }}>{e.expense_date ? new Date(e.expense_date).toLocaleDateString('es-MX', { day:'2-digit', month:'short' }) : '—'}</div>
                <div style={{ fontSize:12, fontWeight:600, color:'#ef4444' }}>{MXN(e.amount)}</div>
                <div style={{ fontSize:11, color: e.deductible ? '#16a34a' : '#9ca3af' }}>{e.deductible ? 'Sí' : 'No'}</div>
              </div>
            ))}
            {expenses.length === 0 && <div style={{ padding:24, textAlign:'center', color:'#9ca3af', fontSize:13 }}>Sin gastos registrados</div>}
          </div>
        </>}

        {/* ── SOPORTE ── */}
        {tab === 'support' && <>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>
            Mensajes de soporte
            {urgentSupport.length > 0 && <Badge bg="#fee2e2" text="#991b1b" label={`${urgentSupport.length} urgentes`} />}
          </div>
          {support.length === 0 && <div style={{ padding:32, textAlign:'center', color:'#9ca3af', fontSize:13, background:'#fff', borderRadius:12 }}>Sin mensajes de soporte</div>}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {support.map(s => (
              <div key={s.id} style={{
                background:'#fff', border:`0.5px solid ${s.urgency==='urgent' ? '#fca5a5' : 'rgba(0,0,0,0.08)'}`,
                borderRadius:10, padding:'14px 18px', display:'flex', gap:12, alignItems:'flex-start',
              }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background: s.role==='driver' ? '#dbeafe' : '#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color: s.role==='driver' ? '#1e40af' : '#166534', flexShrink:0 }}>
                  {s.role === 'driver' ? 'C' : 'A'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#111' }}>{s.driver_email?.split('@')[0] ?? 'Conductor'}</div>
                    {s.urgency === 'urgent' && <Badge bg="#fee2e2" text="#991b1b" label="Urgente" />}
                    {!s.read && <Badge bg="#dbeafe" text="#1e40af" label="No leído" />}
                    {s.ticket_id && <span style={{ fontSize:10, color:'#9ca3af' }}>#{s.ticket_id}</span>}
                  </div>
                  <div style={{ fontSize:13, color:'#374151', lineHeight:1.5 }}>{s.content}</div>
                  <div style={{ fontSize:11, color:'#9ca3af', marginTop:6 }}>{reltime(s.created_at)}</div>
                </div>
                <button
                  onClick={async () => {
                    const { error } = await supabase
                      .from('support_messages')
                      .update({ read: true })
                      .eq('id', s.id);
                    if (!error) {
                      setSupport(prev => prev.map(m => m.id === s.id ? { ...m, read: true } : m));
                    }
                  }}
                  style={{ fontSize:11, padding:'4px 10px', border:'0.5px solid rgba(0,0,0,0.15)', borderRadius:4, background:'#fff', cursor:'pointer', flexShrink:0 }}
                >
                  Marcar leído
                </button>
              </div>
            ))}
          </div>

          {/* Mensajes del sistema */}
          {messages.length > 0 && <>
            <div style={{ fontSize:14, fontWeight:600, margin:'24px 0 12px' }}>Mensajes del sistema</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {messages.slice(0, 10).map(m => (
                <div key={m.id} style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:8, padding:'12px 16px', display:'flex', gap:12, alignItems:'flex-start' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background: m.message_type==='alert'?'#ef4444': m.message_type==='payment'?'#22c55e':'#3b82f6', marginTop:5, flexShrink:0 }}/>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:'#111' }}>{m.title}</div>
                    <div style={{ fontSize:12, color:'#6b7280', marginTop:3 }}>{m.body}</div>
                    <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>{m.driver_email} · {reltime(m.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>}
        </>}

      </div>
    </div>
  );
}

// ── MetricCard ─────────────────────────────────────────────────
function MetricCard({ label, value, sub, subColor, isText }: {
  label: string; value: number | string; sub: string; subColor: string; isText?: boolean;
}) {
  return (
    <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:10, padding:'16px 18px' }}>
      <div style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize: isText ? 20 : 28, fontWeight:700, color:'#111', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, color:subColor, marginTop:6 }}>{sub}</div>
    </div>
  );
}
