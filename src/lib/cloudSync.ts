import { supabase } from './supabase';
import { Doctor, DentalService } from '../types';

const CLOUD_SYNC_ENDPOINT = 'https://api.restful-api.dev/objects/ff808181a09d98f701a0d88f309e1337';
const SYNC_CHANNEL_NAME = 'auradental-cross-device-sync';

export interface CloudClinicPayload {
  doctors: Doctor[];
  services: DentalService[];
  timestamp: number;
}

/**
 * Fetch latest global doctors & services state from cloud storage
 */
export async function fetchCloudClinicState(): Promise<{ doctors?: Doctor[]; services?: DentalService[] } | null> {
  try {
    const res = await fetch(CLOUD_SYNC_ENDPOINT, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (json && json.data) {
      if (typeof json.data.state_json === 'string') {
        const parsed = JSON.parse(json.data.state_json);
        return {
          doctors: Array.isArray(parsed.doctors) && parsed.doctors.length > 0 ? parsed.doctors : undefined,
          services: Array.isArray(parsed.services) && parsed.services.length > 0 ? parsed.services : undefined,
        };
      }
      if (json.data.doctors || json.data.services) {
        return {
          doctors: Array.isArray(json.data.doctors) && json.data.doctors.length > 0 ? json.data.doctors : undefined,
          services: Array.isArray(json.data.services) && json.data.services.length > 0 ? json.data.services : undefined,
        };
      }
    }
  } catch (err) {
    console.warn('Cloud sync fetch error:', err);
  }
  return null;
}

/**
 * Persist latest global doctors & services state to cloud storage
 */
export async function saveCloudClinicState(doctors: Doctor[], services: DentalService[]): Promise<boolean> {
  try {
    const payload: CloudClinicPayload = {
      doctors,
      services,
      timestamp: Date.now(),
    };

    const res = await fetch(CLOUD_SYNC_ENDPOINT, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'auradental_clinic_state',
        data: {
          state_json: JSON.stringify(payload),
        },
      }),
    });

    return res.ok;
  } catch (err) {
    console.warn('Cloud sync save error:', err);
    return false;
  }
}

/**
 * Broadcast clinic state to all connected devices via Supabase WebSockets
 */
export function broadcastLiveSync(doctors: Doctor[], services: DentalService[]) {
  try {
    const ch = supabase.channel(SYNC_CHANNEL_NAME);
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        ch.send({
          type: 'broadcast',
          event: 'CLINIC_SYNC_STATE',
          payload: {
            doctors,
            services,
            timestamp: Date.now(),
          },
        });
      }
    });
  } catch (err) {
    console.warn('Live broadcast error:', err);
  }
}
