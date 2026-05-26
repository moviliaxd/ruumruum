'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ── Tipos ────────────────────────────────────────────────────────
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
  earnings?: number;
  expenses?: number;
  driver_email?: string;
  client_name?: string;
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
  role: string;
  onboarding_completed?: boolean;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  requested:      { label: 'Solicitado',    color: 'bg-yellow-500' },
  accepted:       { label: 'Aceptado',      color: 'bg-blue-500' },
  in_progress:    { label: 'En progreso',   color: 'bg-indigo-500' },
  pickup_arrived: { label: 'En recogida',   color: 'bg-purple-500' },
  vehicle_picked: { label: 'Vehículo tomado', color: 'bg-orange-500' },
  delivering:     { label: 'En camino',     color: 'bg-cyan-500' },
  completed:      { label: 'Completado',    color: 'bg-green-500' },
  cancelled:      { label: 'Cancelado',     color: 'bg-red-500' },
};

const EXPENSE_CATEGORIES: Record<string, string> = {
  caseta: 'Caseta', gasolina: 'Gasolina',
  lavado: 'Lavado', estacionamiento: 'Estacionamiento', otro: 'Otro',
};

function fmt(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
}

// ── Componente principal ─────────────────────────────────────────
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'resumen' | 'viajes' | 'conductores' | 'finanzas' | 'soporte'>('resumen');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [trips, setTrips]       = useState<Trip[]>([]);
  const [docs, setDocs]         = useState<DriverDocument[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [support, setSupport]   = useState<SupportMessage[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [
      { data: tripsData },
      { data: docsData },
      { data: expensesData },
      { data: messagesData },
      { data: supportData },
      { data: profilesData },
    ] = await Promise.all([
      supabase.from('trips').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('driver_documents').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('expenses').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('support_messages').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    setTrips(tripsData ?? []);
    setDocs(docsData ?? []);
    setExpenses(expensesData ?? []);
    setMessages(messagesData ?? []);
    setSupport(supportData ?? []);
    setProfiles(profilesData ?? []);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Tiempo real — viajes
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  // ── Métricas ────────────────────────────────────────────────────
  const completed   = trips.filter(t => t.status === 'completed');
  const active      = trips.filter(t => ['in_progress','pickup_arrived','vehicle_picked','delivering'].includes(t.status));
  const pending     = trips.filter(t => t.status === 'requested');
  const grossEarnings = trips.reduce((s, t) => s + (t.earnings ?? 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const alerts      = pending.length + docs.filter(d => d.status === 'pending').length;
  const conductores = profiles.filter(p => p.role === 'conductor');

  const tabs = [
    { id: 'resumen',     label: 'Resumen' },
    { id: 'viajes',      label: `Viajes (${trips.length})` },
    { id: 'conductores', label: `Conductores (${conductores.length})` },
    { id: 'finanzas',    label: 'Finanzas' },
    { id: 'soporte',     label: 'Soporte' },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-heading font-bold text-xl text-[#FFC400]">RR</span>
          <div>
            <h1 className="font-heading font-bold text-lg leading-none">Tablero maestro</h1>
            <p className="text-xs text-muted-foreground">Ruum Ruum · MoviliaX</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-green-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Conectado
          </span>
          <span className="text-xs text-muted-foreground">
            actualizado {lastUpdated.toLocaleTimeString('es-MX')}
          </span>
          <button
            onClick={fetchAll}
            className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent/10 transition-colors"
          >
            ↻ Actualizar
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border px-6">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#FFC400] text-[#FFC400]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#FFC400] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── RESUMEN ─────────────────────────────────────────── */}
            {activeTab === 'resumen' && (
              <div className="space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total viajes', value: trips.length, sub: `${completed.length} completados` },
                    { label: 'Activos ahora', value: active.length, sub: 'en tránsito' },
                    { label: 'Ganancias brutas', value: fmt(grossEarnings), sub: `−${fmt(totalExpenses)} gastos` },
                    { label: 'Alertas', value: alerts, sub: 'requieren atención', warn: alerts > 0 },
                  ].map(kpi => (
                    <div key={kpi.label} className="bg-card rounded-xl border border-border p-5">
                      <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                      <p className={`text-3xl font-heading font-bold ${kpi.warn ? 'text-red-500' : 'text-foreground'}`}>
                        {kpi.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Distribución de estados */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h2 className="font-heading font-semibold mb-4">Distribución de viajes</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                      const count = trips.filter(t => t.status === key).length;
                      return (
                        <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-background">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
                            <span className="text-sm text-muted-foreground">{cfg.label}</span>
                          </div>
                          <span className="font-heading font-bold text-sm">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actividad reciente */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h2 className="font-heading font-semibold mb-4">Actividad reciente</h2>
                  {trips.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin actividad aún.</p>
                  ) : (
                    <div className="space-y-3">
                      {trips.slice(0, 8).map(trip => (
                        <div key={trip.id} className="flex items-start justify-between p-3 rounded-lg bg-background">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {STATUS_CONFIG[trip.status]?.label ?? trip.status} — {trip.vehicle_brand} {trip.vehicle_model} {trip.vehicle_plates ? `(${trip.vehicle_plates})` : ''}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {trip.pickup_location} → {trip.dropoff_location} · {trip.driver_email?.split('@')[0]} · {timeAgo(trip.created_at)}
                            </p>
                          </div>
                          {(trip.earnings ?? 0) > 0 && (
                            <span className="text-sm font-heading font-bold ml-4">{fmt(trip.earnings!)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── VIAJES ──────────────────────────────────────────── */}
            {activeTab === 'viajes' && (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h2 className="font-heading font-semibold">Todos los viajes</h2>
                  <p className="text-sm text-muted-foreground">{trips.length} registros</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-background">
                      <tr>
                        {['Estado','Origen','Destino','Vehículo','Conductor','Fecha','Ganancia'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {trips.map(trip => (
                        <tr key={trip.id} className="hover:bg-background/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full text-white ${STATUS_CONFIG[trip.status]?.color ?? 'bg-gray-500'}`}>
                              {STATUS_CONFIG[trip.status]?.label ?? trip.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-[160px] truncate">{trip.pickup_location}</td>
                          <td className="px-4 py-3 max-w-[160px] truncate">{trip.dropoff_location}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {[trip.vehicle_brand, trip.vehicle_model, trip.vehicle_plates].filter(Boolean).join(' ')}
                          </td>
                          <td className="px-4 py-3">{trip.driver_email?.split('@')[0] ?? '—'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{trip.trip_date}</td>
                          <td className="px-4 py-3 font-heading font-bold">
                            {(trip.earnings ?? 0) > 0 ? fmt(trip.earnings!) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {trips.length === 0 && (
                    <p className="text-center text-muted-foreground py-12">Sin viajes registrados.</p>
                  )}
                </div>
              </div>
            )}

            {/* ── CONDUCTORES ─────────────────────────────────────── */}
            {activeTab === 'conductores' && (
              <div className="space-y-4">
                {conductores.length === 0 ? (
                  <p className="text-muted-foreground">Sin conductores registrados.</p>
                ) : conductores.map(conductor => {
                  const myTrips    = trips.filter(t => t.driver_email === conductor.email);
                  const myExpenses = expenses.filter(e => e.driver_email === conductor.email);
                  const myDocs     = docs.filter(d => d.driver_email === conductor.email);
                  const myEarnings = myTrips.reduce((s, t) => s + (t.earnings ?? 0), 0);
                  const myExpTotal = myExpenses.reduce((s, e) => s + e.amount, 0);
                  const isActive   = myTrips.some(t => active.map(a => a.id).includes(t.id));
                  const pendingDocs = myDocs.filter(d => d.status === 'pending').length;

                  return (
                    <div key={conductor.id} className="bg-card rounded-xl border border-border p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#FFC400]/20 flex items-center justify-center font-heading font-bold text-[#FFC400]">
                            {(conductor.full_name ?? conductor.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{conductor.full_name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">{conductor.email}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${isActive ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                          {isActive ? 'En viaje' : 'Disponible'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="bg-background rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Viajes</p>
                          <p className="font-heading font-bold text-lg">{myTrips.length}</p>
                        </div>
                        <div className="bg-background rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Ganancias</p>
                          <p className="font-heading font-bold text-lg text-green-500">{fmt(myEarnings)}</p>
                        </div>
                        <div className="bg-background rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Gastos</p>
                          <p className="font-heading font-bold text-lg text-red-500">{fmt(myExpTotal)}</p>
                        </div>
                        <div className="bg-background rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Docs pendientes</p>
                          <p className={`font-heading font-bold text-lg ${pendingDocs > 0 ? 'text-yellow-500' : ''}`}>{pendingDocs}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── FINANZAS ────────────────────────────────────────── */}
            {activeTab === 'finanzas' && (
              <div className="space-y-6">
                {/* Resumen financiero */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Ganancias brutas', value: fmt(grossEarnings), color: 'text-green-500' },
                    { label: 'Total gastos',      value: fmt(totalExpenses), color: 'text-red-500' },
                    { label: 'Neto estimado',     value: fmt(grossEarnings - totalExpenses), color: 'text-[#FFC400]' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-card rounded-xl border border-border p-6 text-center">
                      <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                      <p className={`text-3xl font-heading font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Gastos por categoría */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h2 className="font-heading font-semibold mb-4">Gastos por categoría</h2>
                  <div className="space-y-3">
                    {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => {
                      const total = expenses.filter(e => e.category === key).reduce((s, e) => s + e.amount, 0);
                      const pct   = totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0;
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{label}</span>
                            <span className="font-medium">{fmt(total)} <span className="text-muted-foreground">({pct}%)</span></span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-[#FFC400] rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lista de gastos */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <h2 className="font-heading font-semibold">Detalle de gastos</h2>
                  </div>
                  <div className="divide-y divide-border">
                    {expenses.length === 0 ? (
                      <p className="text-center text-muted-foreground py-12">Sin gastos registrados.</p>
                    ) : expenses.slice(0, 20).map(exp => (
                      <div key={exp.id} className="flex items-center justify-between px-6 py-4">
                        <div>
                          <p className="text-sm font-medium">{EXPENSE_CATEGORIES[exp.category] ?? exp.category}</p>
                          <p className="text-xs text-muted-foreground">
                            {exp.driver_email?.split('@')[0]} · {exp.expense_date ?? timeAgo(exp.created_at)}
                            {exp.deductible && <span className="ml-2 text-green-500">Deducible</span>}
                          </p>
                        </div>
                        <span className="font-heading font-bold text-red-500">{fmt(exp.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── SOPORTE ─────────────────────────────────────────── */}
            {activeTab === 'soporte' && (
              <div className="space-y-4">
                {/* Mensajes del sistema */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="p-6 border-b border-border flex items-center justify-between">
                    <h2 className="font-heading font-semibold">Mensajes del sistema</h2>
                    <span className="text-xs px-2 py-1 bg-[#FFC400]/20 text-[#FFC400] rounded-full">
                      {messages.filter(m => !m.read).length} sin leer
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {messages.length === 0 ? (
                      <p className="text-center text-muted-foreground py-12">Sin mensajes.</p>
                    ) : messages.slice(0, 10).map(msg => (
                      <div key={msg.id} className={`px-6 py-4 ${!msg.read ? 'bg-[#FFC400]/5' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{msg.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{msg.body}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {msg.driver_email?.split('@')[0]} · {timeAgo(msg.created_at)}
                            </p>
                          </div>
                          {!msg.read && (
                            <button
                              onClick={async () => {
                                await supabase.from('messages').update({ read: true }).eq('id', msg.id);
                                fetchAll();
                              }}
                              className="text-xs text-[#FFC400] hover:underline whitespace-nowrap"
                            >
                              Marcar leído
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tickets de soporte */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="p-6 border-b border-border flex items-center justify-between">
                    <h2 className="font-heading font-semibold">Tickets de soporte</h2>
                    <span className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded-full">
                      {support.filter(s => s.urgency === 'urgent').length} urgentes
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {support.length === 0 ? (
                      <p className="text-center text-muted-foreground py-12">Sin tickets abiertos.</p>
                    ) : support.slice(0, 15).map(ticket => (
                      <div key={ticket.id} className={`px-6 py-4 ${ticket.urgency === 'urgent' ? 'border-l-2 border-red-500' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {ticket.urgency === 'urgent' && (
                                <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-500 rounded">Urgente</span>
                              )}
                              {ticket.ticket_id && (
                                <span className="text-xs text-muted-foreground">#{ticket.ticket_id}</span>
                              )}
                            </div>
                            <p className="text-sm">{ticket.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {ticket.driver_email?.split('@')[0]} · {ticket.role} · {timeAgo(ticket.created_at)}
                            </p>
                          </div>
                          {!ticket.read && (
                            <button
                              onClick={async () => {
                                await supabase.from('support_messages').update({ read: true }).eq('id', ticket.id);
                                fetchAll();
                              }}
                              className="text-xs text-[#FFC400] hover:underline whitespace-nowrap"
                            >
                              Marcar leído
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
