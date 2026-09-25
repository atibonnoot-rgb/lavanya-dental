import { supabase } from './supabase';
import { Doctor, DentalService } from '../types';

const CLOUD_SYNC_ENDPOINT = 'https://api.restful-api.dev/objects/ff808181a09d98f701a0d88f309e1337';
export const SYNC_CHANNEL_NAME = 'auradental-cross-device-sync';

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
  // Disabled the global REST API fetch to prevent "ghost doctors" and data overwrites from other users
  return null;
}

/**
 * Persist latest global doctors & services state to cloud storage
 */
export async function saveCloudClinicState(doctors: Doctor[], services: DentalService[]): Promise<boolean> {
  // Disabled the global REST API save to prevent overwriting global data
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

