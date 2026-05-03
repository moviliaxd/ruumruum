import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getMe() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return profile;
}

export type Role = 'cliente' | 'conductor' | 'admin';

export type TripStatus =
  | 'requested' | 'accepted' | 'in_progress'
  | 'pickup_arrived' | 'vehicle_picked'
  | 'delivering' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  curp?: string;
  role: Role;
  selfie_url?: string;
  licencia_url?: string;
  seguro_url?: string;
  onboarding_completed: boolean;
  bank_name?: string;
  bank_clabe?: string;
  bank_account_holder?: string;
  notifications_enabled: boolean;
  dark_mode: boolean;
  created_at: string;
}

export interface Trip {
  id: string;
  status: TripStatus;
  payment_status: 'pending' | 'paid' | 'revoked';
  pickup_location: string;
  dropoff_location: string;
  distance_km?: number;
  vehicle_type?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_plates?: string;
  trip_type?: 'local' | 'foraneo' | 'nocturno' | 'empresarial' | 'personal';
  trip_date: string;
  trip_time?: string;
  earnings?: number;
  expenses?: number;
  commission_pct?: number;
  client_name?: string;
  client_phone?: string;
  driver_email?: string;
  client_email?: string;
  vehicle_check?: Record<string, unknown>;
  notes?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  trip_id?: string;
  driver_email?: string;
  category: 'caseta' | 'gasolina' | 'lavado' | 'estacionamiento' | 'otro';
  amount: number;
  description?: string;
  receipt_url?: string;
  expense_date?: string;
  deductible: boolean;
  created_at: string;
}

export interface DriverDocument {
  id: string;
  driver_email?: string;
  document_type: 'licencia_conducir' | 'comprobante_domicilio' | 'constancia_fiscal' | 'otro';
  document_name: string;
  file_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  expiry_date?: string;
  created_at: string;
}

export interface Message {
  id: string;
  title: string;
  body: string;
  read: boolean;
  driver_email?: string;
  message_type?: 'info' | 'alert' | 'payment' | 'trip';
  created_at: string;
}

export interface SupportMessage {
  id: string;
  driver_email?: string;
  role: 'driver' | 'admin';
  content: string;
  read: boolean;
  ticket_id?: string;
  urgency: 'normal' | 'urgent';
  created_at: string;
}

// ── Storage helper — reemplaza base44.integrations.Core.UploadFile ──
export async function uploadFile(file: File, folder = 'general'): Promise<string> {
  const ext  = file.name.split('.').pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from('ruum-files')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage
    .from('ruum-files')
    .getPublicUrl(path);
  return publicUrl;
}
