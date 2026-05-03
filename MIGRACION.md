# Guía de migración: Base44 → Supabase
# Cada línea de Base44 en tu código y su equivalente exacto

## 1. SETUP

### Antes (base44Client.js)
```js
import { base44 } from '@/api/base44Client'
```

### Después
```js
import { supabase, getMe } from '@/lib/supabase'
```

---

## 2. TRIPS — Viajes.jsx, Ganancias.jsx, Panel.jsx

### Listar todos
```js
// ANTES
base44.entities.Trip.list('-trip_date', 200)

// DESPUÉS
const { data: trips } = await supabase
  .from('trips')
  .select('*')
  .order('trip_date', { ascending: false })
  .limit(200)
```

### Filtrar por conductor (automático con RLS)
```js
// ANTES
base44.entities.Trip.filter({ driver_email: user.email }, '-trip_date', 50)

// DESPUÉS — RLS filtra automáticamente por el usuario logueado
const { data: trips } = await supabase
  .from('trips')
  .select('*')
  .order('trip_date', { ascending: false })
  .limit(50)
```

### Actualizar estado (TripFlowManager)
```js
// ANTES
base44.entities.Trip.update(trip.id, { status: 'in_progress' })

// DESPUÉS
const { data } = await supabase
  .from('trips')
  .update({ status: 'in_progress', updated_at: new Date().toISOString() })
  .eq('id', trip.id)
  .select()
  .single()
```

### Actualizar con vehicle_check
```js
// ANTES
base44.entities.Trip.update(trip.id, { status: 'vehicle_picked', vehicle_check: checkData })

// DESPUÉS
await supabase
  .from('trips')
  .update({ status: 'vehicle_picked', vehicle_check: checkData })
  .eq('id', trip.id)
```

---

## 3. EXPENSES — Gastos.jsx, ExpenseModal.jsx

### Listar gastos
```js
// ANTES
base44.entities.Expense.list('-created_date', 200)

// DESPUÉS
const { data: expenses } = await supabase
  .from('expenses')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(200)
```

### Crear gasto
```js
// ANTES
const user = await base44.auth.me()
await base44.entities.Expense.create({
  category, amount, description, deductible,
  trip_id: tripId,
  driver_email: user.email,
  receipt_url: receiptUrl,
  expense_date: format(new Date(), 'yyyy-MM-dd'),
})

// DESPUÉS
const profile = await getMe()
await supabase.from('expenses').insert({
  category, amount, description, deductible,
  trip_id: tripId,
  driver_email: profile.email,
  receipt_url: receiptUrl,
  expense_date: format(new Date(), 'yyyy-MM-dd'),
})
```

---

## 4. DRIVER DOCUMENTS — DocumentsSection.jsx, Onboarding.jsx

### Listar documentos
```js
// ANTES
base44.entities.DriverDocument.list('-created_date', 50)

// DESPUÉS
const { data: docs } = await supabase
  .from('driver_documents')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(50)
```

### Crear documento
```js
// ANTES
base44.entities.DriverDocument.create({
  document_type, document_name, file_url, driver_email
})

// DESPUÉS
await supabase.from('driver_documents').insert({
  document_type, document_name, file_url, driver_email
})
```

### Bulk create (Onboarding)
```js
// ANTES
await base44.entities.DriverDocument.bulkCreate(docsToCreate)

// DESPUÉS
await supabase.from('driver_documents').insert(docsToCreate)
```

---

## 5. AUTH — AuthContext.jsx, Onboarding.jsx

### Obtener usuario actual
```js
// ANTES
const user = await base44.auth.me()

// DESPUÉS
const profile = await getMe()
// profile.email, profile.full_name, profile.role, etc.
```

### Actualizar perfil
```js
// ANTES
await base44.auth.updateMe({
  full_name, phone, curp, onboarding_completed: true,
  selfie_url, licencia_url, seguro_url,
})

// DESPUÉS
const { data: { user } } = await supabase.auth.getUser()
await supabase.from('profiles').update({
  full_name, phone, curp, onboarding_completed: true,
  selfie_url, licencia_url, seguro_url,
}).eq('id', user.id)
```

### Login / Logout
```js
// ANTES
base44.auth.redirectToLogin(window.location.href)
base44.auth.logout()

// DESPUÉS
await supabase.auth.signInWithOtp({ email }) // magic link
await supabase.auth.signOut()
```

### Escuchar cambios de sesión
```js
// DESPUÉS (en AuthContext)
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN')  setUser(session.user)
  if (event === 'SIGNED_OUT') setUser(null)
})
```

---

## 6. SUBIDA DE ARCHIVOS — ExpenseModal, DocumentsSection, Onboarding

### Antes (Base44 storage)
```js
const { file_url } = await base44.integrations.Core.UploadFile({ file })
```

### Después (Supabase Storage)
```js
// Crear bucket 'ruum-files' en Supabase Dashboard → Storage
const ext = file.name.split('.').pop()
const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

const { error } = await supabase.storage
  .from('ruum-files')
  .upload(path, file, { cacheControl: '3600', upsert: false })

const { data: { publicUrl } } = supabase.storage
  .from('ruum-files')
  .getPublicUrl(path)

// publicUrl es el equivalente de file_url
```

---

## 7. TIEMPO REAL — solo con Supabase (no existía en Base44)

### Escuchar viajes nuevos (vista conductor)
```js
// En Viajes.jsx — agregar después de la query inicial
useEffect(() => {
  const channel = supabase
    .channel('trips-realtime')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'trips',
    }, (payload) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [])
```

---

## 8. REACT QUERY — sin cambios en la estructura

### El patrón es idéntico, solo cambia la queryFn
```js
// ANTES
const { data: trips = [] } = useQuery({
  queryKey: ['trips'],
  queryFn: () => base44.entities.Trip.list('-trip_date', 200),
})

// DESPUÉS
const { data: trips = [] } = useQuery({
  queryKey: ['trips'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('trip_date', { ascending: false })
      .limit(200)
    if (error) throw error
    return data ?? []
  },
})
```

---

## 9. VARIABLES DE ENTORNO (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

Obtén estos valores en: supabase.com → tu proyecto → Settings → API

---

## 10. RESUMEN: archivos a modificar

| Archivo | Cambios |
|---------|---------|
| src/api/base44Client.js | Eliminar, reemplazar con lib/supabase.ts |
| src/lib/AuthContext.jsx | Reemplazar base44.auth.* con supabase.auth.* |
| src/pages/Viajes.jsx | Trip.list → supabase query + realtime |
| src/pages/Ganancias.jsx | Trip.list + Expense.list → supabase queries |
| src/pages/Gastos.jsx | Expense.list → supabase query |
| src/pages/Onboarding.jsx | auth.updateMe + UploadFile + bulkCreate |
| src/components/expenses/ExpenseModal.jsx | Expense.create + UploadFile |
| src/components/settings/DocumentsSection.jsx | DriverDocument.list + create + UploadFile |
| src/components/trip/TripFlowManager.jsx | Trip.update |
| src/pages/Soporte.jsx | SupportMessage.* → supabase |
