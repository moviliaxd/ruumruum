-- ============================================================
-- RUUM RUUM — Esquema completo Supabase
-- Migración desde Base44: Trip, Expense, DriverDocument, Message, SupportMessage
-- + nuevas tablas: profiles (usuarios + conductores + admin), bookings (app clientes)
-- ============================================================

-- Extensión para UUIDs
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLA: profiles
-- Reemplaza base44.auth.me() y base44.entities.User
-- Rol determina qué vista ve el usuario al hacer login
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  full_name   text,
  phone       text,
  curp        text,
  role        text not null default 'cliente' check (role in ('cliente', 'conductor', 'admin')),
  -- Campos específicos del conductor
  selfie_url              text,
  licencia_url            text,
  seguro_url              text,
  onboarding_completed    boolean default false,
  -- Datos bancarios (conductor)
  bank_name               text,
  bank_clabe              text,
  bank_account_holder     text,
  -- Preferencias
  notifications_enabled   boolean default true,
  dark_mode               boolean default false,
  -- Timestamps
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- TABLA: trips
-- Reemplaza base44.entities.Trip
-- Usada tanto por conductores como por clientes (via bookings)
-- ============================================================
create table trips (
  id              uuid primary key default uuid_generate_v4(),
  -- Estado del viaje (flujo de 8 pasos del conductor)
  status          text not null default 'requested'
                  check (status in ('requested','accepted','in_progress','pickup_arrived','vehicle_picked','delivering','completed','cancelled')),
  payment_status  text default 'pending'
                  check (payment_status in ('pending','paid','revoked')),
  -- Ruta
  pickup_location   text not null,
  dropoff_location  text not null,
  distance_km       numeric(8,2),
  -- Vehículo
  vehicle_type    text,
  vehicle_brand   text,
  vehicle_model   text,
  vehicle_color   text,
  vehicle_plates  text,
  -- Tipo de viaje
  trip_type       text check (trip_type in ('local','foraneo','nocturno','empresarial','personal')),
  -- Fechas y horarios
  trip_date       date not null,
  trip_time       text,
  scheduled_date  timestamptz,
  -- Finanzas
  earnings        numeric(10,2) default 0,
  expenses        numeric(10,2) default 0,
  commission_pct  numeric(5,2) default 0,
  -- Cliente
  client_name     text,
  client_phone    text,
  -- Relaciones
  driver_email    text references profiles(email),
  client_email    text references profiles(email),
  -- Check de vehículo al recoger (JSON con fotos, km, combustible, llaves, notas)
  vehicle_check   jsonb,
  -- Notas
  notes           text,
  -- Timestamps
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  created_by  text
);

-- ============================================================
-- TABLA: expenses
-- Reemplaza base44.entities.Expense
-- ============================================================
create table expenses (
  id            uuid primary key default uuid_generate_v4(),
  trip_id       uuid references trips(id) on delete set null,
  driver_email  text references profiles(email),
  category      text not null check (category in ('caseta','gasolina','lavado','estacionamiento','otro')),
  amount        numeric(10,2) not null,
  description   text,
  receipt_url   text,
  expense_date  date,
  deductible    boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  created_by    text
);

-- ============================================================
-- TABLA: driver_documents
-- Reemplaza base44.entities.DriverDocument
-- ============================================================
create table driver_documents (
  id            uuid primary key default uuid_generate_v4(),
  driver_email  text references profiles(email),
  document_type text not null check (document_type in ('licencia_conducir','comprobante_domicilio','constancia_fiscal','otro')),
  document_name text not null,
  file_url      text,
  status        text default 'pending' check (status in ('pending','approved','rejected')),
  expiry_date   date,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  created_by    text
);

-- ============================================================
-- TABLA: messages
-- Reemplaza base44.entities.Message
-- Notificaciones del sistema hacia conductores
-- ============================================================
create table messages (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  body          text not null,
  read          boolean default false,
  driver_email  text references profiles(email),
  message_type  text check (message_type in ('info','alert','payment','trip')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  created_by    text
);

-- ============================================================
-- TABLA: support_messages
-- Reemplaza base44.entities.SupportMessage
-- Chat de soporte entre conductor y admin
-- ============================================================
create table support_messages (
  id            uuid primary key default uuid_generate_v4(),
  driver_email  text references profiles(email),
  role          text not null check (role in ('driver','admin')),
  content       text not null,
  read          boolean default false,
  ticket_id     text,
  urgency       text default 'normal' check (urgency in ('normal','urgent')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  created_by    text
);

-- ============================================================
-- REALTIME — activar para tiempo real entre cliente y conductor
-- ============================================================
alter publication supabase_realtime add table trips;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table support_messages;

-- ============================================================
-- TRIGGERS — updated_at automático
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_trips_updated_at          before update on trips            for each row execute function update_updated_at();
create trigger trg_expenses_updated_at       before update on expenses         for each row execute function update_updated_at();
create trigger trg_driver_documents_updated  before update on driver_documents  for each row execute function update_updated_at();
create trigger trg_messages_updated_at       before update on messages          for each row execute function update_updated_at();
create trigger trg_support_messages_updated  before update on support_messages  for each row execute function update_updated_at();
create trigger trg_profiles_updated_at       before update on profiles          for each row execute function update_updated_at();

-- ============================================================
-- TRIGGER — crear profile automáticamente al registrarse
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'cliente')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- RLS (Row Level Security) — cada usuario ve solo sus datos
-- ============================================================
alter table profiles          enable row level security;
alter table trips             enable row level security;
alter table expenses          enable row level security;
alter table driver_documents  enable row level security;
alter table messages          enable row level security;
alter table support_messages  enable row level security;

-- Profiles: cada quien ve y edita solo el suyo; admin ve todos
create policy "profiles_select_own"   on profiles for select using (auth.uid() = id);
create policy "profiles_update_own"   on profiles for update using (auth.uid() = id);
create policy "profiles_admin_all"    on profiles for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Trips: conductor ve sus viajes; cliente ve viajes donde es client_email; admin ve todos
create policy "trips_conductor"  on trips for all using (
  driver_email = (select email from profiles where id = auth.uid())
);
create policy "trips_cliente"    on trips for select using (
  client_email = (select email from profiles where id = auth.uid())
);
create policy "trips_insert_cliente" on trips for insert with check (
  client_email = (select email from profiles where id = auth.uid())
);
create policy "trips_admin"      on trips for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Expenses: solo el conductor dueño + admin
create policy "expenses_own"    on expenses for all using (
  driver_email = (select email from profiles where id = auth.uid())
);
create policy "expenses_admin"  on expenses for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Driver documents: solo el conductor dueño + admin
create policy "docs_own"    on driver_documents for all using (
  driver_email = (select email from profiles where id = auth.uid())
);
create policy "docs_admin"  on driver_documents for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Messages: solo el conductor destinatario + admin
create policy "messages_own"    on messages for select using (
  driver_email = (select email from profiles where id = auth.uid())
);
create policy "messages_update" on messages for update using (
  driver_email = (select email from profiles where id = auth.uid())
);
create policy "messages_admin"  on messages for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Support messages: conductor ve los suyos; admin ve todos
create policy "support_own"   on support_messages for all using (
  driver_email = (select email from profiles where id = auth.uid())
);
create policy "support_admin" on support_messages for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
create index idx_trips_driver_email  on trips(driver_email);
create index idx_trips_client_email  on trips(client_email);
create index idx_trips_status        on trips(status);
create index idx_trips_trip_date     on trips(trip_date desc);
create index idx_expenses_driver     on expenses(driver_email);
create index idx_expenses_trip       on expenses(trip_id);
create index idx_docs_driver         on driver_documents(driver_email);
create index idx_messages_driver     on messages(driver_email);
create index idx_support_driver      on support_messages(driver_email);
create index idx_support_ticket      on support_messages(ticket_id);
