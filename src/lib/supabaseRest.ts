const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dlylhcrcxdjbfvprbuqb.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRseWxoY3JjeGRqYmZ2cHJidXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTY5NTEsImV4cCI6MjEwNTI5Mjk1MX0.PqbFhdxXU6G_HfYFZjJj2R4r4YIds6EHqCjpUOXlUGA';

const DEFAULT_HEADERS: HeadersInit = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'x-client-info': 'lavanyadental-rest-client',
};

async function safeFetch<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, {
      ...options,
      headers: {
        ...DEFAULT_HEADERS,
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      console.warn(`Supabase REST ${endpoint} returned ${res.status}: ${res.statusText}`);
      return null;
    }
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : null;
  } catch (err) {
    console.warn(`Supabase REST ${endpoint} fetch failed:`, err);
    return null;
  }
}

export const restApi = {
  async getClinicSettings(): Promise<Record<string, unknown> | null> {
    const rows = await safeFetch<Record<string, unknown>[]>('/clinic_settings?select=*&limit=1');
    return rows && rows.length > 0 ? rows[0] : null;
  },

  async getServices(): Promise<Record<string, unknown>[]> {
    return (await safeFetch<Record<string, unknown>[]>('/services?select=*&order=id.asc')) || [];
  },

  async getDoctors(): Promise<Record<string, unknown>[]> {
    return (await safeFetch<Record<string, unknown>[]>('/doctors?select=*&order=display_order.asc')) || [];
  },

  async getAppointments(): Promise<Record<string, unknown>[]> {
    return (await safeFetch<Record<string, unknown>[]>('/appointments?select=*&order=created_at.desc')) || [];
  },

  async insertAppointment(payload: Record<string, unknown>): Promise<boolean> {
    const res = await safeFetch('/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    });
    return res !== null;
  },

  async updateAppointment(id: string, payload: Record<string, unknown>): Promise<boolean> {
    const res = await safeFetch(`/appointments?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    });
    return res !== null;
  },

  async deleteAppointment(id: string): Promise<boolean> {
    const res = await safeFetch(`/appointments?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res !== null;
  },

  async updateDoctorAvailability(doctorId: string, isAvailableToday: boolean): Promise<boolean> {
    const res = await safeFetch(`/doctors?id=eq.${encodeURIComponent(doctorId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ is_available_today: isAvailableToday }),
    });
    return res !== null;
  },

  async updateClinicSettings(id: string, payload: Record<string, unknown>): Promise<boolean> {
    const res = await safeFetch(`/clinic_settings?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    });
    return res !== null;
  },

  insertAuditLog(payload: Record<string, unknown>): void {
    safeFetch('/audit_logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    }).catch(() => {});
  },
};
