'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Tipos ──────────────────────────────────────────────────────────────
interface Trip {
  id: string;
  status: string;
  payment_status?: string;
  pickup_location: string;
  dropoff_location: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_plates?: string;
  trip_type?: string;
  trip_date: string;
  trip_time?: string;
  earnings?: number;
  driver_email?: string;
  client_name?: string;
  client_phone?: string;
  notes?: string;
  created_at: string;
}

interface Expense {
  id: string;
  trip_id?: string;
  driver_email?: string;
  category: string;
  amount: number;
  description?: string;
  deductible?: boolean;
  expense_date?: string;
  created_at: string;
}

interface DriverDocument {
  id: string;
  driver_email?: string;
  document_type: string;
  document_name: string;
  status: string;
  expiry_date?: string;
  created_at: string;
}

interface Message {
  id: string;
  title: string;
  body: string;
  read: boolean;
  driver_email?: string;
  message_type?: string;
  created_at: string;
}

interface SupportMessage {
  id: string;
  driver_email?: string;
  role: string;
  content: string;
  read: boolean;
  ticket_id?: string;
  urgency?: string;
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: string;
  onboarding_completed?: boolean;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  requested:      { label: 'Solicitado',      cls: 'pill-warning' },
  accepted:       { label: 'Aceptado',        cls: 'pill-info' },
  in_progress:    { label: 'En curso',        cls: 'pill-info' },
  pickup_arrived: { label: 'En recogida',     cls: 'pill-info' },
  vehicle_picked: { label: 'Veh. tomado',     cls: 'pill-info' },
  delivering:     { label: 'En camino',       cls: 'pill-info' },
  completed:      { label: 'Completado',      cls: 'pill-success' },
  cancelled:      { label: 'Cancelado',       cls: 'pill-danger' },
};

const EXPENSE_CAT: Record<string, string> = {
  caseta: 'Caseta', gasolina: 'Gasolina',
  lavado: 'Lavado', estacionamiento: 'Estacionamiento', otro: 'Otro',
};

const DOC_TYPES: Record<string, string> = {
  licencia_conducir: 'Licencia', comprobante_domicilio: 'Comprobante domicilio',
  constancia_fiscal: 'Constancia fiscal', otro: 'Otro',
};

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('es-MX');
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `hace ${s}s`;
  if (s < 3600) return `hace ${Math.floor(s / 60)}m`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)}h`;
  return `hace ${Math.floor(s / 86400)}d`;
}

type Section = 'dashboard' | 'viajes' | 'usuarios' | 'conductores' | 'evidencia' |
               'incidencias' | 'pagos' | 'documentos' | 'tarifas' | 'empresas' |
               'reportes' | 'configuracion';

const NAV: { id: Section; label: string; icon: string }[] = [
  { id: 'dashboard',     label: 'Dashboard',      icon: '▦' },
  { id: 'viajes',        label: 'Viajes',          icon: '⌁' },
  { id: 'usuarios',      label: 'Usuarios',        icon: '◉' },
  { id: 'conductores',   label: 'Conductores',     icon: '◆' },
  { id: 'evidencia',     label: 'Evidencia',       icon: '▧' },
  { id: 'incidencias',   label: 'Incidencias',     icon: '!' },
  { id: 'pagos',         label: 'Pagos',           icon: '$' },
  { id: 'documentos',    label: 'Documentos',      icon: '▣' },
  { id: 'tarifas',       label: 'Tarifas',         icon: '%' },
  { id: 'empresas',      label: 'Empresas',        icon: '▤' },
  { id: 'reportes',      label: 'Reportes',        icon: '⌬' },
  { id: 'configuracion', label: 'Configuración',   icon: '⚙' },
];

// ── Sub-componentes pequeños ───────────────────────────────────────────
function Pill({ status }: { status: string }) {
  const cfg = STATUS_LABELS[status] ?? { label: status, cls: 'pill-info' };
  return <span className={`pill ${cfg.cls}`}>{cfg.label}</span>;
}

function Toast({ msg, show }: { msg: string; show: boolean }) {
  return (
    <div className={`toast ${show ? 'toast-show' : ''}`}>{msg}</div>
  );
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────────
export default function AdminDashboard() {
  const [section, setSection] = useState<Section>('dashboard');
  const [search, setSearch]   = useState('');
  const [tripFilter, setTripFilter] = useState('all');
  const [modalOpen, setModalOpen]   = useState(false);
  const [toast, setToast]     = useState({ msg: '', show: false });
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Estado de datos ──────────────────────────────────────────────────
  const [trips, setTrips]       = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [docs, setDocs]         = useState<DriverDocument[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [support, setSupport]   = useState<SupportMessage[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // ── Toast helper ─────────────────────────────────────────────────────
  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, show: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2200);
  }

  // ── Fetch datos ──────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [
      { data: t }, { data: e }, { data: d },
      { data: m }, { data: s }, { data: p },
    ] = await Promise.all([
      supabase.from('trips').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('expenses').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('driver_documents').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('support_messages').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200),
    ]);
    setTrips(t ?? []);
    setExpenses(e ?? []);
    setDocs(d ?? []);
    setMessages(m ?? []);
    setSupport(s ?? []);
    setProfiles(p ?? []);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Tiempo real ──────────────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase.channel('admin-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_documents' }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchAll]);

  // ── Métricas calculadas ───────────────────────────────────────────────
  const conductores  = profiles.filter(p => p.role === 'conductor');
  const clientes     = profiles.filter(p => p.role === 'cliente');
  const active       = trips.filter(t => ['in_progress','pickup_arrived','vehicle_picked','delivering','accepted'].includes(t.status));
  const sinAsignar   = trips.filter(t => t.status === 'requested' && !t.driver_email);
  const completados  = trips.filter(t => t.status === 'completed');
  const incidencias  = support.filter(s => s.urgency === 'urgent' && !s.read);
  const docsRevision = docs.filter(d => d.status === 'pending');
  const pagPendiente = trips.filter(t => t.payment_status === 'pending' && t.status === 'completed');
  const ingresos     = trips.reduce((s, t) => s + (t.earnings ?? 0), 0);
  const totalGastos  = expenses.reduce((s, e) => s + e.amount, 0);

  // ── Filtros de búsqueda ───────────────────────────────────────────────
  const filteredTrips = trips.filter(t => {
    const matchSearch = !search || [
      t.pickup_location, t.dropoff_location, t.vehicle_brand,
      t.vehicle_model, t.vehicle_plates, t.driver_email, t.client_name,
    ].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = tripFilter === 'all' ||
      (tripFilter === 'pending'   && t.status === 'requested') ||
      (tripFilter === 'active'    && active.some(a => a.id === t.id)) ||
      (tripFilter === 'scheduled' && t.status === 'accepted') ||
      (tripFilter === 'finished'  && t.status === 'completed') ||
      (tripFilter === 'review'    && ['cancelled'].includes(t.status));
    return matchSearch && matchFilter;
  });

  // ── Crear viaje ───────────────────────────────────────────────────────
  const [newTrip, setNewTrip] = useState({
    client_name: '', vehicle_brand: '', pickup_location: '',
    dropoff_location: '', trip_date: '', trip_type: 'local', notes: '',
  });

  async function saveTrip() {
    const { error } = await supabase.from('trips').insert([{
      ...newTrip,
      status: 'requested',
      payment_status: 'pending',
    }]);
    if (error) { showToast('Error al guardar viaje'); return; }
    showToast('Viaje creado correctamente');
    setModalOpen(false);
    fetchAll();
  }

  // ── Acción: marcar mensaje leído ──────────────────────────────────────
  async function markRead(id: string, table: 'messages' | 'support_messages') {
    await supabase.from(table).update({ read: true }).eq('id', id);
    fetchAll();
    showToast('Marcado como leído');
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        :root{--black:#171717;--ink:#24272b;--steel:#60666d;--muted:#7c838b;--paper:#f6f7f4;--white:#ffffff;--route:#ffc400;--blue:#2563eb;--cyan:#00a7b5;--green:#16825d;--red:#b42318;--line:#dedfd8;}
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:Inter,Arial,sans-serif;color:var(--ink);background:var(--paper);font-size:14px;}
        button,input,select,textarea{font:inherit;cursor:pointer;}
        .shell{display:grid;grid-template-columns:252px minmax(0,1fr);min-height:100vh;}
        .sidebar{position:sticky;top:0;height:100vh;background:var(--black);color:#fff;display:flex;flex-direction:column;gap:14px;padding:18px;overflow-y:auto;}
        .brand-wrap{background:#fff;border-radius:8px;padding:10px;display:flex;align-items:center;justify-content:center;}
        .brand-wrap svg{width:100%;max-height:60px;}
        .product-badge{display:inline-flex;margin-top:8px;padding:3px 9px;border-radius:999px;background:var(--route);color:var(--black);font-weight:900;text-transform:uppercase;font-size:11px;}
        .brand-desc{margin-top:8px;color:rgba(255,255,255,.6);font-size:12px;line-height:1.45;}
        .side-nav{display:grid;gap:3px;}
        .nav-btn{width:100%;min-height:38px;border:0;border-radius:7px;color:rgba(255,255,255,.74);background:transparent;display:flex;align-items:center;gap:8px;padding:0 10px;font-weight:700;font-size:13px;}
        .nav-btn .icon{width:20px;color:var(--route);font-size:13px;flex-shrink:0;text-align:center;}
        .nav-btn.active,.nav-btn:hover{color:var(--black);background:var(--route);}
        .nav-btn.active .icon,.nav-btn:hover .icon{color:var(--black);}
        .op-card{margin-top:auto;display:flex;align-items:center;gap:10px;padding:11px;border:1px solid rgba(255,255,255,.16);border-radius:8px;}
        .avatar{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:var(--route);color:var(--black);font-weight:900;font-size:12px;flex-shrink:0;}
        .op-card strong{color:#fff;font-size:13px;}
        .op-card small{display:block;color:rgba(255,255,255,.55);font-size:11px;margin-top:2px;}
        .main{padding:22px;min-width:0;overflow:auto;}
        .topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;}
        .eyebrow{display:block;color:var(--steel);font-size:11px;letter-spacing:1.2px;text-transform:uppercase;font-weight:900;}
        .topbar h1{font-size:clamp(22px,3vw,36px);font-weight:900;line-height:1;}
        .top-right{display:flex;align-items:center;gap:8px;}
        .search-box{display:flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:8px;background:#fff;padding:0 10px;min-height:40px;}
        .search-box input{border:0;outline:0;width:200px;font-size:13px;background:transparent;}
        .btn{min-height:38px;border:0;border-radius:8px;padding:0 13px;font-weight:900;font-size:13px;cursor:pointer;}
        .btn-black{background:var(--black);color:#fff;}
        .btn-yellow{background:var(--route);color:var(--black);}
        .btn-sm{min-height:30px;padding:0 10px;font-size:12px;}
        .btn-danger{background:var(--red);color:#fff;}
        .section{display:none}.section.active{display:block;}
        .command-strip{border:1px solid var(--line);border-radius:8px;padding:18px 22px;display:flex;align-items:center;justify-content:space-between;gap:12px;background:linear-gradient(120deg,rgba(23,23,23,.96),rgba(23,23,23,.82)),linear-gradient(90deg,rgba(255,196,0,.3),rgba(0,167,181,.18));color:#fff;margin-bottom:14px;}
        .command-strip .eyebrow{color:rgba(255,255,255,.6);}
        .command-strip h2{font-size:clamp(18px,2.5vw,28px);font-weight:900;}
        .q-actions{display:flex;gap:6px;flex-wrap:wrap;}
        .metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px;}
        .metric-card{border:1px solid var(--line);border-radius:8px;background:#fff;padding:14px;display:grid;align-content:space-between;min-height:106px;border-top:4px solid transparent;}
        .metric-card>span{color:var(--steel);text-transform:uppercase;font-size:11px;font-weight:900;}
        .metric-card strong{font-size:clamp(22px,3vw,32px);font-weight:900;letter-spacing:-1px;}
        .metric-card small{color:var(--muted);font-size:12px;}
        .mc-yellow{border-top-color:var(--route);}
        .mc-red{border-top-color:var(--red);}
        .mc-green{border-top-color:var(--green);}
        .dash-grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(260px,.7fr);gap:12px;margin-bottom:12px;}
        .dash-grid-lower{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(260px,.9fr);gap:12px;}
        .panel{border:1px solid var(--line);border-radius:8px;background:#fff;padding:16px;min-width:0;}
        .block-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;}
        .block-head h2{font-size:15px;font-weight:800;}
        .pill{display:inline-flex;align-items:center;border-radius:999px;padding:4px 9px;font-size:11px;font-weight:900;white-space:nowrap;}
        .pill-success{background:rgba(22,130,93,.12);color:var(--green);}
        .pill-warning{background:rgba(255,196,0,.22);color:#6d5400;}
        .pill-danger{background:rgba(180,35,24,.1);color:var(--red);}
        .pill-info{background:rgba(37,99,235,.1);color:#1d4ed8;}
        .pill-live{background:rgba(22,130,93,.12);color:var(--green);}
        .map-stage{position:relative;min-height:260px;border:1px solid var(--line);border-radius:8px;background:linear-gradient(90deg,rgba(23,23,23,.05) 1px,transparent 1px),linear-gradient(rgba(23,23,23,.05) 1px,transparent 1px),#fbfbf8;background-size:34px 34px;}
        .zone{position:absolute;border:1px solid rgba(0,167,181,.28);border-radius:8px;background:rgba(0,167,181,.08);color:#006c76;font-weight:900;display:grid;place-items:center;font-size:11px;}
        .z1{width:28%;height:30%;left:8%;top:12%}.z2{width:34%;height:36%;right:10%;top:18%}.z3{width:30%;height:28%;left:30%;bottom:9%}
        .driver-pin{position:absolute;width:13px;height:13px;border:3px solid #fff;border-radius:50%;background:var(--route);box-shadow:0 0 0 4px rgba(255,196,0,.2);}
        .p1{left:22%;top:22%}.p2{right:24%;top:37%}.p3{left:47%;bottom:20%}
        .trip-line{position:absolute;height:3px;border-radius:999px;background:var(--black);opacity:.5;transform-origin:left center;}
        .l1{width:44%;left:24%;top:30%;transform:rotate(14deg)}.l2{width:32%;left:45%;top:57%;transform:rotate(-28deg)}
        .alert-list{display:grid;gap:7px;}
        .alert-item{width:100%;border:1px solid var(--line);border-radius:8px;background:#fbfbf9;padding:10px;text-align:left;display:grid;gap:3px;cursor:pointer;}
        .alert-item strong{font-size:13px;font-weight:800;}
        .alert-item span{color:var(--muted);font-size:12px;}
        .alert-hot{border-color:rgba(255,196,0,.75);background:rgba(255,196,0,.07);}
        .compact-table{border:1px solid var(--line);border-radius:8px;overflow:auto;}
        .trow{display:grid;grid-template-columns:80px minmax(140px,1fr) 66px 110px;align-items:center;gap:7px;padding:9px 12px;border-top:1px solid var(--line);font-size:12px;}
        .trow:first-child{border-top:0;}.thead{background:#eeeeea;color:var(--steel);font-weight:900;}
        .timeline{list-style:none;display:grid;gap:7px;}
        .timeline li{display:grid;grid-template-columns:10px 1fr;gap:7px;align-items:start;}
        .timeline li>span{width:9px;height:9px;margin-top:4px;border-radius:50%;background:var(--route);}
        .timeline strong{display:block;font-size:13px;font-weight:700;}
        .timeline small{color:var(--muted);font-size:12px;}
        .tabs{display:flex;gap:6px;margin-bottom:12px;overflow-x:auto;}
        .tab{border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--steel);min-height:34px;padding:0 13px;font-weight:900;font-size:12px;white-space:nowrap;}
        .tab.active{border-color:var(--route);background:var(--route);color:var(--black);}
        .split-layout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(280px,.75fr);gap:12px;}
        .dtable{border:1px solid var(--line);border-radius:8px;overflow:auto;}
        .drow{display:grid;align-items:center;gap:7px;min-width:600px;padding:9px 12px;border-top:1px solid var(--line);font-size:12px;grid-template-columns:80px 120px 120px minmax(130px,1fr) 100px 110px 72px;}
        .drow:first-child{border-top:0;}.dhead{background:#eeeeea;color:var(--steel);font-weight:900;}
        .drow button{min-height:28px;border:0;border-radius:6px;background:var(--black);color:#fff;padding:0 8px;font-weight:900;font-size:11px;}
        .section-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);gap:12px;}
        .drivers-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;}
        .driver-tile{border:1px solid var(--line);border-radius:8px;padding:12px;display:grid;gap:6px;background:#fbfbf9;}
        .driver-tile strong{font-size:13px;}
        .driver-tile small{color:var(--muted);font-size:12px;}
        .driver-tile button{min-height:32px;border:0;border-radius:7px;background:var(--black);color:#fff;font-weight:900;font-size:11px;}
        .stack{display:grid;gap:7px;}
        .stack-item{border:1px solid var(--line);border-radius:8px;background:#fbfbf9;padding:10px;display:grid;gap:3px;}
        .stack-item strong{font-size:13px;}
        .stack-item span{color:var(--muted);font-size:12px;line-height:1.4;}
        .action-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}
        .action-grid button{min-height:36px;border:0;border-radius:8px;background:var(--black);color:#fff;font-weight:900;font-size:12px;}
        .action-single{grid-template-columns:1fr;}
        .detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-bottom:12px;}
        .detail-grid div{border:1px solid var(--line);border-radius:8px;padding:9px;background:#fbfbf9;}
        .detail-grid span{display:block;color:var(--muted);font-size:11px;font-weight:900;text-transform:uppercase;margin-bottom:3px;}
        .evidence-compare{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:12px;}
        .photo-ph{min-height:200px;border-radius:8px;border:1px solid var(--line);display:grid;place-items:center;text-align:center;padding:14px;font-weight:900;font-size:12px;background:repeating-linear-gradient(45deg,#f1f2ee,#f1f2ee 10px,#fafaf7 10px,#fafaf7 20px);}
        .photo-ph.marked{border-color:rgba(180,35,24,.4);background:repeating-linear-gradient(45deg,#fdf0f0,#fdf0f0 10px,#fafaf7 10px,#fafaf7 20px);}
        .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
        .form-grid label{color:var(--steel);font-size:11px;font-weight:900;text-transform:uppercase;}
        .form-grid input,.form-grid select,.form-grid textarea{width:100%;min-height:36px;margin-top:5px;border:1px solid var(--line);border-radius:8px;padding:0 10px;background:#fff;color:var(--ink);font-size:13px;}
        .form-grid textarea{min-height:64px;padding:9px 10px;resize:vertical;}
        .form-wide{grid-column:1/-1;}
        .chip-grid{display:flex;flex-wrap:wrap;gap:6px;}
        .chip-grid span{border:1px solid var(--line);border-radius:999px;background:#fbfbf9;padding:6px 11px;font-size:12px;font-weight:900;}
        .bar-chart{height:120px;display:flex;align-items:end;gap:6px;border-bottom:1px solid var(--line);padding-top:10px;margin-bottom:8px;}
        .bar-chart span{flex:1;border-radius:6px 6px 0 0;background:linear-gradient(180deg,var(--route),var(--cyan));}
        .big-number{margin:12px 0 7px;font-size:34px;font-weight:900;color:var(--black);}
        .report-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
        .config-grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(280px,1.1fr);gap:12px;}
        .pagos-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}
        .wide-panel{grid-column:1/-1;}
        .incidents .drow{grid-template-columns:80px 140px 110px 130px 140px 90px;min-width:520px;}
        .docs .drow{grid-template-columns:140px 160px 120px 120px 160px;min-width:500px;}
        .toast{position:fixed;right:18px;bottom:18px;z-index:50;transform:translateY(14px);opacity:0;pointer-events:none;background:var(--black);color:#fff;border-left:5px solid var(--route);border-radius:8px;padding:11px 14px;font-weight:900;font-size:13px;transition:.2s ease;}
        .toast-show{opacity:1!important;transform:translateY(0)!important;}
        .modal-overlay{display:none;position:fixed;inset:0;z-index:40;background:rgba(23,23,23,.55);align-items:center;justify-content:center;}
        .modal-overlay.open{display:flex;}
        .modal-box{background:#fff;border-radius:12px;padding:22px;width:min(620px,calc(100vw - 28px));max-height:85vh;overflow-y:auto;}
        .modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
        .modal-head h2{font-size:18px;font-weight:800;}
        .icon-btn{width:36px;height:36px;border:1px solid var(--line);border-radius:8px;background:#fff;font-size:17px;display:grid;place-items:center;}
        .modal-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:14px;}
        .modal-footer button{min-height:38px;border:1px solid var(--line);border-radius:8px;background:#fff;padding:0 14px;font-weight:900;font-size:13px;}
        .loading{display:flex;align-items:center;justify-content:center;height:200px;}
        .spinner{width:32px;height:32px;border:3px solid var(--route);border-top-color:transparent;border-radius:50%;animation:spin .8s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .live-dot{width:8px;height:8px;border-radius:50%;background:var(--green);display:inline-block;animation:pulse 1.5s ease-in-out infinite;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .tag{display:inline-flex;align-items:center;border-radius:999px;padding:4px 9px;font-size:11px;font-weight:900;background:rgba(37,99,235,.1);color:#1d4ed8;}
        .text-muted{color:var(--muted);font-size:12px;}
        .notes-label{display:block;color:var(--steel);font-size:11px;font-weight:900;text-transform:uppercase;margin-top:10px;}
        .notes-ta{width:100%;min-height:66px;margin-top:6px;border:1px solid var(--line);border-radius:8px;padding:9px 10px;resize:vertical;font-size:13px;}
        @media(max-width:1100px){.shell{grid-template-columns:1fr}.sidebar{position:static;height:auto}.metric-grid,.drivers-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dash-grid,.dash-grid-lower,.split-layout,.section-grid,.config-grid,.report-grid,.pagos-grid{grid-template-columns:1fr}}
        @media(max-width:700px){.main,.sidebar{padding:14px}.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.form-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="shell">
        {/* ── SIDEBAR ────────────────────────────────────────────────── */}
        <aside className="sidebar">
          <div>
            <div className="brand-wrap">
              <svg viewBox="0 0 480 110" xmlns="http://www.w3.org/2000/svg">
                <text x="8" y="84" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="88" fill="#888">R</text>
                <text x="86" y="84" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="88" fill="#555">R</text>
                <path d="M30 84 C52 104 66 68 84 84 L100 72 C120 56 134 88 154 76" stroke="#FFC400" strokeWidth="5" fill="none" strokeLinecap="round"/>
                <circle cx="26" cy="84" r="7" fill="none" stroke="#FFC400" strokeWidth="4"/>
                <circle cx="156" cy="76" r="7" fill="none" stroke="#FFC400" strokeWidth="4"/>
                <path d="M100 72 L109 64 L98 68 Z" fill="#FFC400"/>
                <line x1="186" y1="16" x2="186" y2="96" stroke="#ddd" strokeWidth="1.5"/>
                <text x="198" y="44" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="26" fill="#333">Ruum Ruum</text>
                <text x="198" y="63" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="12" fill="#777" letterSpacing="1.4">TRASLADO VEHICULAR</text>
                <text x="198" y="78" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="11" fill="#999" letterSpacing="1.2">CONDUCTORES CERTIFICADOS</text>
                <line x1="198" y1="85" x2="300" y2="85" stroke="#FFC400" strokeWidth="2"/>
                <text x="198" y="100" fontFamily="Arial,sans-serif" fontSize="10" fill="#bbb">by MoviliaX</text>
              </svg>
            </div>
            <span className="product-badge">Admin</span>
            <p className="brand-desc">Torre de control para viajes, evidencia, pagos y validaciones.</p>
          </div>
          <nav className="side-nav">
            {NAV.map(n => (
              <button key={n.id} className={`nav-btn ${section === n.id ? 'active' : ''}`}
                onClick={() => setSection(n.id)}>
                <span className="icon">{n.icon}</span>{n.label}
              </button>
            ))}
          </nav>
          <div className="op-card">
            <div className="avatar">MX</div>
            <div><strong>Operación MoviliaX</strong><small>Super administrador</small></div>
          </div>
        </aside>

        {/* ── MAIN ───────────────────────────────────────────────────── */}
        <main className="main">
          <header className="topbar">
            <div>
              <span className="eyebrow">Ruum Ruum Admin · MoviliaX</span>
              <h1>{NAV.find(n => n.id === section)?.label}</h1>
            </div>
            <div className="top-right">
              <span style={{ fontSize: 11, color: 'var(--steel)', display:'flex', alignItems:'center', gap:5 }}>
                <span className="live-dot" /> {lastUpdated.toLocaleTimeString('es-MX')}
              </span>
              <label className="search-box">
                <span style={{ color: 'var(--steel)' }}>⌕</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." />
              </label>
              <button className="btn btn-black" onClick={() => setModalOpen(true)}>Nuevo viaje</button>
            </div>
          </header>

          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : (
            <>
              {/* ── DASHBOARD ───────────────────────────────────────── */}
              <div className={`section ${section === 'dashboard' ? 'active' : ''}`}>
                <div className="command-strip">
                  <div>
                    <span className="eyebrow">Estado operativo</span>
                    <h2>¿Qué necesita atención ahora?</h2>
                  </div>
                  <div className="q-actions">
                    <button className="btn btn-yellow btn-sm" onClick={() => setSection('viajes')}>Asignar conductor</button>
                    <button className="btn btn-yellow btn-sm" onClick={() => setSection('evidencia')}>Revisar evidencia</button>
                    <button className="btn btn-yellow btn-sm" onClick={() => setSection('pagos')}>Liberar pago</button>
                  </div>
                </div>
                <div className="metric-grid">
                  <article className="metric-card mc-yellow"><span>Viajes activos</span><strong>{active.length}</strong><small>{trips.filter(t=>t.trip_type==='foraneo').length} foráneos</small></article>
                  <article className="metric-card mc-yellow"><span>Sin asignar</span><strong>{sinAsignar.length}</strong><small>requieren conductor</small></article>
                  <article className="metric-card"><span>Total viajes</span><strong>{trips.length}</strong><small>{completados.length} completados</small></article>
                  <article className="metric-card"><span>Conductores</span><strong>{conductores.length}</strong><small>{active.length} en viaje activo</small></article>
                  <article className="metric-card mc-red"><span>Soporte urgente</span><strong>{incidencias.length}</strong><small>sin atender</small></article>
                  <article className="metric-card mc-yellow"><span>Docs por revisar</span><strong>{docsRevision.length}</strong><small>pendientes</small></article>
                  <article className="metric-card"><span>Pagos pendientes</span><strong>{pagPendiente.length}</strong><small>viajes completados</small></article>
                  <article className="metric-card mc-green"><span>Ingresos totales</span><strong>{fmt(ingresos)}</strong><small>acumulado</small></article>
                </div>
                <div className="dash-grid">
                  <div className="panel">
                    <div className="block-head">
                      <div><h2>Mapa de operación</h2><p className="text-muted">Viajes activos y zonas críticas</p></div>
                      <span className="pill pill-live">● En vivo</span>
                    </div>
                    <div className="map-stage">
                      <div className="zone z1">Polanco</div>
                      <div className="zone z2">Santa Fe</div>
                      <div className="zone z3">AIFA</div>
                      <span className="driver-pin p1" />
                      <span className="driver-pin p2" />
                      <span className="driver-pin p3" />
                      <span className="trip-line l1" />
                      <span className="trip-line l2" />
                    </div>
                  </div>
                  <div className="panel">
                    <div className="block-head"><h2>Alertas operativas</h2><span className="tag">Prioridad</span></div>
                    <div className="alert-list">
                      {sinAsignar.slice(0,2).map(t => (
                        <button key={t.id} className="alert-item alert-hot" onClick={() => { setSection('viajes'); setSelectedTrip(t); }}>
                          <strong>Viaje sin conductor</strong>
                          <span>{t.pickup_location} → {t.dropoff_location}</span>
                        </button>
                      ))}
                      {docsRevision.slice(0,2).map(d => (
                        <button key={d.id} className="alert-item" onClick={() => setSection('documentos')}>
                          <strong>Documento pendiente</strong>
                          <span>{DOC_TYPES[d.document_type] ?? d.document_type} · {d.driver_email?.split('@')[0]}</span>
                        </button>
                      ))}
                      {sinAsignar.length === 0 && docsRevision.length === 0 && (
                        <div className="alert-item"><strong>Sin alertas</strong><span>Todo en orden por ahora.</span></div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="dash-grid-lower" style={{ marginTop: 12 }}>
                  <div className="panel">
                    <div className="block-head"><h2>Últimos viajes</h2><button className="btn btn-black btn-sm" onClick={() => setSection('viajes')}>Ver todos</button></div>
                    <div className="compact-table">
                      <div className="trow thead"><span>ID</span><span>Ruta</span><span>Hora</span><span>Estatus</span></div>
                      {trips.slice(0,5).map(t => (
                        <div key={t.id} className="trow">
                          <span style={{ fontSize:11 }}>{t.id.slice(0,8)}…</span>
                          <span>{t.pickup_location?.slice(0,20)} → {t.dropoff_location?.slice(0,18)}</span>
                          <span>{t.trip_time ?? '—'}</span>
                          <Pill status={t.status} />
                        </div>
                      ))}
                      {trips.length === 0 && <div className="trow"><span style={{gridColumn:'1/-1',color:'var(--muted)'}}>Sin viajes aún</span></div>}
                    </div>
                  </div>
                  <div className="panel">
                    <div className="block-head"><h2>Actividad reciente</h2><span className="tag">Bitácora</span></div>
                    <ol className="timeline">
                      {trips.slice(0,4).map(t => (
                        <li key={t.id}><span /><div><strong>{STATUS_LABELS[t.status]?.label ?? t.status} — {t.vehicle_brand} {t.vehicle_model}</strong><small>{timeAgo(t.created_at)}</small></div></li>
                      ))}
                      {trips.length === 0 && <li><span /><div><strong>Sin actividad aún</strong><small>Crea el primer viaje</small></div></li>}
                    </ol>
                  </div>
                </div>
              </div>

              {/* ── VIAJES ──────────────────────────────────────────── */}
              <div className={`section ${section === 'viajes' ? 'active' : ''}`}>
                <div className="tabs">
                  {[['all','Todos'],['pending','Pendientes'],['scheduled','Programados'],['active','En curso'],['finished','Finalizados'],['review','Cancelados']].map(([f,l]) => (
                    <button key={f} className={`tab ${tripFilter===f?'active':''}`} onClick={() => setTripFilter(f)}>{l}</button>
                  ))}
                </div>
                <div className="split-layout">
                  <div className="panel">
                    <div className="block-head"><h2>Centro operativo de viajes</h2><button className="btn btn-black btn-sm" onClick={() => setModalOpen(true)}>Crear</button></div>
                    <div className="dtable">
                      <div className="drow dhead"><span>ID</span><span>Solicitante</span><span>Vehículo</span><span>Ruta</span><span>Conductor</span><span>Estatus</span><span>Acción</span></div>
                      {filteredTrips.slice(0,15).map(t => (
                        <div key={t.id} className="drow">
                          <span style={{fontSize:11}}>{t.id.slice(0,8)}…</span>
                          <span>{t.client_name ?? '—'}</span>
                          <span>{[t.vehicle_brand,t.vehicle_model].filter(Boolean).join(' ') || '—'}</span>
                          <span>{t.pickup_location?.slice(0,18)} → {t.dropoff_location?.slice(0,14)}</span>
                          <span>{t.driver_email?.split('@')[0] ?? 'Sin asignar'}</span>
                          <Pill status={t.status} />
                          <button onClick={() => { setSelectedTrip(t); showToast(`Detalle ${t.id.slice(0,8)}`); }}>Detalle</button>
                        </div>
                      ))}
                      {filteredTrips.length === 0 && <div className="drow"><span style={{gridColumn:'1/-1',color:'var(--muted)'}}>Sin viajes en esta categoría</span></div>}
                    </div>
                  </div>
                  <div className="panel">
                    {selectedTrip ? (
                      <>
                        <div className="block-head"><h2>{selectedTrip.id.slice(0,8)}…</h2><Pill status={selectedTrip.status} /></div>
                        <div className="detail-grid">
                          <div><span>Tipo</span><strong>{selectedTrip.trip_type ?? '—'}</strong></div>
                          <div><span>Solicitante</span><strong>{selectedTrip.client_name ?? '—'}</strong></div>
                          <div><span>Conductor</span><strong>{selectedTrip.driver_email?.split('@')[0] ?? 'Sin asignar'}</strong></div>
                          <div><span>Vehículo</span><strong>{[selectedTrip.vehicle_brand,selectedTrip.vehicle_model,selectedTrip.vehicle_plates].filter(Boolean).join(' ') || '—'}</strong></div>
                          <div><span>Origen</span><strong>{selectedTrip.pickup_location}</strong></div>
                          <div><span>Destino</span><strong>{selectedTrip.dropoff_location}</strong></div>
                          <div><span>Fecha</span><strong>{selectedTrip.trip_date}</strong></div>
                          <div><span>Ganancia</span><strong>{selectedTrip.earnings ? fmt(selectedTrip.earnings) : '—'}</strong></div>
                        </div>
                        <div className="action-grid">
                          <button className="btn btn-black btn-sm" onClick={() => showToast('Asignar conductor — próximamente')}>Asignar conductor</button>
                          <button className="btn btn-black btn-sm" onClick={() => showToast('Editar horario — próximamente')}>Editar horario</button>
                          <button className="btn btn-black btn-sm" onClick={() => setSection('evidencia')}>Ver evidencia</button>
                          <button className="btn btn-black btn-sm" onClick={() => showToast('Incidencia registrada')}>Registrar incidencia</button>
                          <button className="btn btn-danger btn-sm" style={{gridColumn:'1/-1'}} onClick={async () => { await supabase.from('trips').update({status:'cancelled'}).eq('id',selectedTrip.id); fetchAll(); setSelectedTrip(null); showToast('Viaje cancelado'); }}>Cancelar viaje</button>
                        </div>
                        {selectedTrip.notes && <p className="text-muted" style={{marginTop:8}}>{selectedTrip.notes}</p>}
                      </>
                    ) : (
                      <div style={{color:'var(--muted)',fontSize:13,textAlign:'center',marginTop:40}}>Selecciona un viaje para ver el detalle</div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── USUARIOS ────────────────────────────────────────── */}
              <div className={`section ${section === 'usuarios' ? 'active' : ''}`}>
                <div className="section-grid">
                  <div className="panel">
                    <div className="block-head"><h2>Usuarios solicitantes</h2><span className="tag">Personas y empresas</span></div>
                    <div className="dtable" style={{'--cols':'1fr 1fr 1fr 70px 70px'} as React.CSSProperties}>
                      <div className="drow dhead" style={{gridTemplateColumns:'1fr 1fr 110px 60px 70px',minWidth:0}}><span>Nombre</span><span>Email</span><span>Rol</span><span>Viajes</span><span>Estado</span></div>
                      {profiles.filter(p=>!search||p.full_name?.toLowerCase().includes(search.toLowerCase())||p.email.toLowerCase().includes(search.toLowerCase())).slice(0,10).map(p => {
                        const userTrips = trips.filter(t=>t.client_email===p.email||t.driver_email===p.email);
                        return (
                          <div key={p.id} className="drow" style={{gridTemplateColumns:'1fr 1fr 110px 60px 70px',minWidth:0}}>
                            <span>{p.full_name || '—'}</span>
                            <span style={{fontSize:11}}>{p.email}</span>
                            <span><span className="pill pill-info">{p.role}</span></span>
                            <span>{userTrips.length}</span>
                            <span><span className={`pill ${p.onboarding_completed?'pill-success':'pill-warning'}`}>{p.onboarding_completed?'Activo':'Incompleto'}</span></span>
                          </div>
                        );
                      })}
                      {profiles.length===0 && <div className="drow" style={{gridTemplateColumns:'1fr',minWidth:0}}><span className="text-muted">Sin usuarios registrados</span></div>}
                    </div>
                  </div>
                  <div className="panel">
                    <div className="block-head"><h2>Resumen</h2></div>
                    <div className="stack">
                      <div className="stack-item"><strong>Conductores registrados</strong><span>{conductores.length} en la plataforma</span></div>
                      <div className="stack-item"><strong>Clientes registrados</strong><span>{clientes.length} en la plataforma</span></div>
                      <div className="stack-item"><strong>Total usuarios</strong><span>{profiles.length} cuentas activas</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── CONDUCTORES ─────────────────────────────────────── */}
              <div className={`section ${section === 'conductores' ? 'active' : ''}`}>
                <div className="section-grid">
                  <div className="panel">
                    <div className="block-head"><h2>Conductores certificados</h2><button className="btn btn-black btn-sm" onClick={() => showToast('Validar conductor — próximamente')}>Validar nuevo</button></div>
                    {conductores.length > 0 ? (
                      <div className="drivers-grid">
                        {conductores.map(c => {
                          const myTrips = trips.filter(t=>t.driver_email===c.email);
                          const isActive = myTrips.some(t=>active.some(a=>a.id===t.id));
                          const myDocs = docs.filter(d=>d.driver_email===c.email);
                          const initials = (c.full_name ?? c.email).slice(0,2).toUpperCase();
                          return (
                            <div key={c.id} className="driver-tile">
                              <div className="avatar" style={{width:34,height:34,fontSize:12}}>{initials}</div>
                              <strong>{c.full_name ?? c.email.split('@')[0]}</strong>
                              <span className={`pill ${isActive?'pill-info':'pill-success'}`}>{isActive?'En viaje':'Disponible'}</span>
                              <small>{myTrips.length} viajes · {myDocs.length} docs</small>
                              <button className="btn btn-black btn-sm" onClick={() => showToast(`Perfil de ${c.full_name ?? c.email}`)}>Ver perfil</button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted">Sin conductores registrados aún.</p>
                    )}
                  </div>
                  <div className="panel">
                    <div className="block-head"><h2>Acciones administrativas</h2></div>
                    <div className="action-grid action-single">
                      {['Validar conductor','Aprobar documentos','Suspender conductor','Ver ganancias','Agregar nota interna'].map(a => (
                        <button key={a} className="btn btn-black btn-sm" onClick={() => showToast(`${a} — próximamente`)}>{a}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── EVIDENCIA ───────────────────────────────────────── */}
              <div className={`section ${section === 'evidencia' ? 'active' : ''}`}>
                <div className="split-layout">
                  <div className="panel">
                    <div className="block-head"><h2>Revisión visual</h2><span className="pill pill-warning">En revisión</span></div>
                    <div className="evidence-compare">
                      <div><span style={{display:'block',color:'var(--steel)',fontWeight:900,marginBottom:7,fontSize:12}}>Inicial</span><div className="photo-ph">Exterior · placas · tablero</div></div>
                      <div><span style={{display:'block',color:'var(--steel)',fontWeight:900,marginBottom:7,fontSize:12}}>Final</span><div className="photo-ph marked">Kilometraje final pendiente</div></div>
                    </div>
                    <div className="action-grid">
                      {['Aprobar evidencia','Marcar incompleta','Solicitar aclaración','Asociar a incidencia'].map(a => (
                        <button key={a} className="btn btn-black btn-sm" onClick={() => showToast(`${a} — próximamente`)}>{a}</button>
                      ))}
                    </div>
                  </div>
                  <div className="panel">
                    <div className="block-head"><h2>Cola de evidencia</h2></div>
                    <div className="stack">
                      {trips.slice(0,5).map(t => (
                        <div key={t.id} className="stack-item">
                          <strong>{t.id.slice(0,8)} · {STATUS_LABELS[t.status]?.label}</strong>
                          <span>{t.pickup_location} → {t.dropoff_location}</span>
                        </div>
                      ))}
                      {trips.length===0 && <div className="stack-item"><strong>Sin viajes</strong><span>No hay viajes que revisar.</span></div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── INCIDENCIAS ─────────────────────────────────────── */}
              <div className={`section ${section === 'incidencias' ? 'active' : ''}`}>
                <div className="panel">
                  <div className="block-head"><h2>Tickets de soporte</h2><span className="pill pill-danger">{support.filter(s=>s.urgency==='urgent').length} urgentes</span></div>
                  <div className="dtable incidents">
                    <div className="drow dhead"><span>Ticket</span><span>Conductor</span><span>Contenido</span><span>Urgencia</span><span>Estado</span><span>Acción</span></div>
                    {support.slice(0,15).map(s => (
                      <div key={s.id} className="drow">
                        <span style={{fontSize:11}}>#{s.ticket_id ?? s.id.slice(0,6)}</span>
                        <span>{s.driver_email?.split('@')[0] ?? '—'}</span>
                        <span>{s.content?.slice(0,30)}</span>
                        <span><span className={`pill ${s.urgency==='urgent'?'pill-danger':'pill-info'}`}>{s.urgency==='urgent'?'Urgente':'Normal'}</span></span>
                        <span><span className={`pill ${s.read?'pill-success':'pill-warning'}`}>{s.read?'Leído':'Sin leer'}</span></span>
                        <button onClick={() => markRead(s.id, 'support_messages')}>{s.read?'Ver':'Atender'}</button>
                      </div>
                    ))}
                    {support.length===0 && <div className="drow"><span style={{gridColumn:'1/-1',color:'var(--muted)'}}>Sin tickets de soporte</span></div>}
                  </div>
                </div>
              </div>

              {/* ── PAGOS ───────────────────────────────────────────── */}
              <div className={`section ${section === 'pagos' ? 'active' : ''}`}>
                <div className="pagos-grid">
                  <div className="panel">
                    <div className="block-head"><h2>Ingresos</h2><span className="tag">{fmt(ingresos)}</span></div>
                    <div className="stack">
                      {trips.filter(t=>(t.earnings??0)>0).slice(0,4).map(t => (
                        <div key={t.id} className="stack-item">
                          <strong>{t.client_name ?? 'Cliente'} · {t.id.slice(0,8)}</strong>
                          <span>Tarifa {fmt(t.earnings!)} · {STATUS_LABELS[t.payment_status??'pending']?.label ?? t.payment_status}</span>
                        </div>
                      ))}
                      {trips.filter(t=>(t.earnings??0)>0).length===0 && <div className="stack-item"><strong>Sin ingresos registrados</strong></div>}
                    </div>
                  </div>
                  <div className="panel">
                    <div className="block-head"><h2>Pagos a conductores</h2></div>
                    <div className="stack">
                      {conductores.slice(0,4).map(c => {
                        const total = trips.filter(t=>t.driver_email===c.email).reduce((s,t)=>s+(t.earnings??0),0);
                        return (
                          <div key={c.id} className="stack-item">
                            <strong>{c.full_name ?? c.email.split('@')[0]}</strong>
                            <span>Ganancias acumuladas: {fmt(total)}</span>
                          </div>
                        );
                      })}
                      {conductores.length===0 && <div className="stack-item"><strong>Sin conductores</strong></div>}
                    </div>
                  </div>
                  <div className="panel wide-panel">
                    <div className="block-head"><h2>Gastos y ajustes</h2><span className="tag">Total: {fmt(totalGastos)}</span></div>
                    <div className="dtable">
                      <div className="drow dhead" style={{gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',minWidth:0}}><span>Tipo</span><span>Conductor</span><span>Monto</span><span>Fecha</span><span>Deducible</span></div>
                      {expenses.slice(0,10).map(e => (
                        <div key={e.id} className="drow" style={{gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',minWidth:0}}>
                          <span>{EXPENSE_CAT[e.category]??e.category}</span>
                          <span>{e.driver_email?.split('@')[0]??'—'}</span>
                          <span>{fmt(e.amount)}</span>
                          <span>{e.expense_date ?? timeAgo(e.created_at)}</span>
                          <span><span className={`pill ${e.deductible?'pill-success':'pill-info'}`}>{e.deductible?'Sí':'No'}</span></span>
                        </div>
                      ))}
                      {expenses.length===0 && <div className="drow" style={{gridTemplateColumns:'1fr',minWidth:0}}><span className="text-muted">Sin gastos registrados</span></div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── DOCUMENTOS ──────────────────────────────────────── */}
              <div className={`section ${section === 'documentos' ? 'active' : ''}`}>
                <div className="panel">
                  <div className="block-head"><h2>Validación documental</h2><span className="tag">{docsRevision.length} pendientes</span></div>
                  <div className="dtable docs">
                    <div className="drow dhead"><span>Documento</span><span>Conductor</span><span>Tipo</span><span>Estatus</span><span>Acción</span></div>
                    {docs.slice(0,15).map(d => (
                      <div key={d.id} className="drow">
                        <span>{DOC_TYPES[d.document_type]??d.document_type}</span>
                        <span>{d.driver_email?.split('@')[0]??'—'}</span>
                        <span>{d.document_type}</span>
                        <span><span className={`pill ${d.status==='approved'?'pill-success':d.status==='rejected'?'pill-danger':'pill-warning'}`}>{d.status==='approved'?'Aprobado':d.status==='rejected'?'Rechazado':'Pendiente'}</span></span>
                        <div style={{display:'flex',gap:5}}>
                          <button onClick={async()=>{await supabase.from('driver_documents').update({status:'approved'}).eq('id',d.id);fetchAll();showToast('Aprobado');}}>Aprobar</button>
                          <button onClick={async()=>{await supabase.from('driver_documents').update({status:'rejected'}).eq('id',d.id);fetchAll();showToast('Rechazado');}}>Rechazar</button>
                        </div>
                      </div>
                    ))}
                    {docs.length===0 && <div className="drow"><span style={{gridColumn:'1/-1',color:'var(--muted)'}}>Sin documentos subidos</span></div>}
                  </div>
                </div>
              </div>

              {/* ── TARIFAS ─────────────────────────────────────────── */}
              <div className={`section ${section === 'tarifas' ? 'active' : ''}`}>
                <div className="section-grid">
                  <div className="panel">
                    <div className="block-head"><h2>Reglas de tarifa</h2><button className="btn btn-black btn-sm" onClick={() => showToast('Tarifas guardadas')}>Guardar</button></div>
                    <div className="form-grid">
                      {[['Tarifa base','$650'],['Por kilómetro','$18'],['Tarifa mínima','$850'],['Pago conductor','38%'],['Recargo nocturno','15%'],['Urgencia','20%']].map(([l,v]) => (
                        <label key={l}>{l}<input defaultValue={v} /></label>
                      ))}
                    </div>
                  </div>
                  <div className="panel">
                    <div className="block-head"><h2>Variables</h2></div>
                    <div className="chip-grid">
                      {['Distancia','Tiempo','Tipo de vehículo','Foráneo','Peajes','Viáticos','Riesgo','Ruta frecuente'].map(c => (
                        <span key={c}>{c}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── EMPRESAS ────────────────────────────────────────── */}
              <div className={`section ${section === 'empresas' ? 'active' : ''}`}>
                <div className="panel">
                  <div className="block-head"><h2>Cuentas corporativas</h2><button className="btn btn-black btn-sm" onClick={() => showToast('Nueva empresa — próximamente')}>Nueva empresa</button></div>
                  <div className="dtable">
                    <div className="drow dhead" style={{gridTemplateColumns:'1fr 1fr 1fr 70px 1fr',minWidth:0}}><span>Empresa</span><span>Tipo</span><span>Contacto</span><span>Viajes</span><span>Condiciones</span></div>
                    {[['Grupo Norte','Grupo automotriz','María Ortega',126,'Tarifa especial'],['Agencia Roma','Agencia','Iván López',34,'Facturación mensual'],['Flotilla Axion','Flotilla','Sofía Lara',72,'Crédito corporativo']].map(([n,t,c,v,k]) => (
                      <div key={n as string} className="drow" style={{gridTemplateColumns:'1fr 1fr 1fr 70px 1fr',minWidth:0}}>
                        <span>{n}</span><span>{t}</span><span>{c}</span><span>{v}</span><span>{k}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── REPORTES ────────────────────────────────────────── */}
              <div className={`section ${section === 'reportes' ? 'active' : ''}`}>
                <div className="report-grid">
                  <div className="panel">
                    <h2 style={{marginBottom:10}}>Operación</h2>
                    <div className="bar-chart">
                      {[44,68,51,82,73,91,60].map((h,i) => <span key={i} style={{height:`${h}%`}} />)}
                    </div>
                    <p className="text-muted">Viajes por día, tiempos de asignación, cancelaciones e incidencias.</p>
                  </div>
                  <div className="panel">
                    <h2 style={{marginBottom:10}}>Finanzas</h2>
                    <div className="big-number">{fmt(ingresos)}</div>
                    <p className="text-muted">Ingresos totales, pagos a conductores, gastos ({fmt(totalGastos)}) y margen estimado ({fmt(ingresos - totalGastos)}).</p>
                  </div>
                  <div className="panel">
                    <h2 style={{marginBottom:10}}>Conductores</h2>
                    <div className="big-number">{conductores.length}</div>
                    <p className="text-muted">Conductores registrados. {active.length} en viaje activo. {docsRevision.length} documentos pendientes.</p>
                  </div>
                  <div className="panel">
                    <h2 style={{marginBottom:10}}>Viajes</h2>
                    <div className="big-number">{trips.length}</div>
                    <p className="text-muted">{completados.length} completados, {active.length} activos, {sinAsignar.length} sin asignar.</p>
                  </div>
                </div>
              </div>

              {/* ── CONFIGURACIÓN ───────────────────────────────────── */}
              <div className={`section ${section === 'configuracion' ? 'active' : ''}`}>
                <div className="config-grid">
                  <div className="panel">
                    <h2 style={{marginBottom:12}}>Roles y permisos</h2>
                    <div className="stack">
                      {[['Super administrador','Acceso total a plataforma.'],['Administrador operativo','Viajes, conductores, evidencia e incidencias.'],['Finanzas','Pagos, depósitos, gastos y reportes financieros.'],['Soporte','Usuarios, conductores e incidencias.'],['Validador documental','Revisión y aprobación de documentos.'],['Comercial','Empresas, usuarios corporativos y condiciones.']].map(([r,d]) => (
                        <div key={r} className="stack-item"><strong>{r}</strong><span>{d}</span></div>
                      ))}
                    </div>
                  </div>
                  <div className="panel">
                    <h2 style={{marginBottom:12}}>Reglas generales</h2>
                    <div className="action-grid action-single">
                      {['Zonas de operación','Tipos de servicio','Reglas de evidencia','Estados de viaje','Plantillas de notificación','Bitácora de cambios'].map(a => (
                        <button key={a} className="btn btn-black btn-sm" onClick={() => showToast(`${a} — próximamente`)}>{a}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── MODAL NUEVO VIAJE ─────────────────────────────────────────── */}
      <div className={`modal-overlay ${modalOpen ? 'open' : ''}`} onClick={e => { if(e.target===e.currentTarget) setModalOpen(false); }}>
        <div className="modal-box">
          <div className="modal-head">
            <div><span className="eyebrow">Nuevo traslado</span><h2>Crear viaje administrativo</h2></div>
            <button className="icon-btn" onClick={() => setModalOpen(false)}>×</button>
          </div>
          <div className="form-grid">
            <label>Solicitante<input placeholder="Usuario o empresa" value={newTrip.client_name} onChange={e => setNewTrip(p=>({...p,client_name:e.target.value}))} /></label>
            <label>Vehículo<input placeholder="Marca y modelo" value={newTrip.vehicle_brand} onChange={e => setNewTrip(p=>({...p,vehicle_brand:e.target.value}))} /></label>
            <label>Origen<input placeholder="Dirección de recolección" value={newTrip.pickup_location} onChange={e => setNewTrip(p=>({...p,pickup_location:e.target.value}))} /></label>
            <label>Destino<input placeholder="Dirección de entrega" value={newTrip.dropoff_location} onChange={e => setNewTrip(p=>({...p,dropoff_location:e.target.value}))} /></label>
            <label>Fecha<input type="date" value={newTrip.trip_date} onChange={e => setNewTrip(p=>({...p,trip_date:e.target.value}))} /></label>
            <label>Tipo de servicio<select value={newTrip.trip_type} onChange={e => setNewTrip(p=>({...p,trip_type:e.target.value}))}>
              <option value="local">Local</option><option value="foraneo">Foráneo</option>
              <option value="empresarial">Empresarial</option><option value="nocturno">Nocturno</option>
            </select></label>
            <label className="form-wide">Instrucciones especiales<textarea placeholder="Referencias, contactos, condiciones de entrega" value={newTrip.notes} onChange={e => setNewTrip(p=>({...p,notes:e.target.value}))} /></label>
          </div>
          <div className="modal-footer">
            <button onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-black" onClick={saveTrip}>Guardar viaje</button>
          </div>
        </div>
      </div>

      <Toast msg={toast.msg} show={toast.show} />
    </>
  );
}
