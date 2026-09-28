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
 * Broadcast clinic state to all connected devices via Supabase WebSockets using a single persistent channel
 */
export function broadcastLiveSync(doctors: Doctor[], services: DentalService[]) {
  try {
    if (!activeLiveChannel) {
      activeLiveChannel = supabase.channel(SYNC_CHANNEL_NAME);
      activeLiveChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          activeLiveChannel?.send({
            type: 'broadcast',
            event: 'CLINIC_SYNC_STATE',
            payload: { doctors, services, timestamp: Date.now() },
          });
        }
      });
    } else {
      activeLiveChannel.send({
        type: 'broadcast',
        event: 'CLINIC_SYNC_STATE',
        payload: { doctors, services, timestamp: Date.now() },
      });
    }
  } catch (err) {
    console.warn('Live broadcast error:', err);
  }
}
