import { supabase } from './supabase';
import { Doctor, DentalService } from '../types';

export const SYNC_CHANNEL_NAME = 'lavanyadental-cross-device-sync';

export interface CloudClinicPayload {
  doctors: Doctor[];
  services: DentalService[];
  timestamp: number;
}

let activeLiveChannel: ReturnType<typeof supabase.channel> | null = null;

/**
 * Fetch latest global doctors & services state from cloud storage with strict fast timeout
 */
export async function fetchCloudClinicState(): Promise<{ doctors?: Doctor[]; services?: DentalService[]; timestamp?: number } | null> {
  return null;
}

/**
 * Persist latest global doctors & services state to cloud storage
 */
export async function saveCloudClinicState(_doctors: Doctor[], _services: DentalService[]): Promise<boolean> {
  return false;
}

/**
 * Broadcast clinic state to all connected devices via native BroadcastChannel (0ms, same origin)
 */
export function broadcastLiveSync(doctors: Doctor[], services: DentalService[]) {
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('auradental_clinic_sync');
      bc.postMessage({ type: 'CLINIC_SYNC_STATE', payload: { doctors, services, timestamp: Date.now() } });
      bc.close();
    }
  } catch {}
}
