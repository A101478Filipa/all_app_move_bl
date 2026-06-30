import AsyncStorage from '@react-native-async-storage/async-storage';
import { BeltService } from './types';
import { MockBeltService } from './MockBeltService';
import { WifiBeltService } from './WifiBeltService';

const STORAGE_KEY = 'belt.wifi.baseUrl';

let currentImpl: BeltService = new MockBeltService();

/**
 * Singleton facade. Methods always proxy to the currently-active
 * implementation (Mock or Wi-Fi). Swap with `setBeltBaseUrl`.
 */
export const beltService = new Proxy({} as BeltService, {
  get(_target, prop) {
    const value = (currentImpl as any)[prop];
    return typeof value === 'function' ? value.bind(currentImpl) : value;
  },
});

/** Load saved belt URL (if any) and pick the implementation. Call on app start. */
export async function initBeltService(): Promise<void> {
  try {
    const url = await AsyncStorage.getItem(STORAGE_KEY);
    if (url && url.trim().length > 0) {
      await switchToWifi(url.trim());
      return;
    }
  } catch {
    // fall through to mock
  }
  switchToMock();
}

export async function getBeltBaseUrl(): Promise<string | null> {
  try { return await AsyncStorage.getItem(STORAGE_KEY); } catch { return null; }
}

export async function setBeltBaseUrl(url: string | null): Promise<void> {
  if (!url || url.trim().length === 0) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await safeDisconnect();
    switchToMock();
    return;
  }
  const normalised = url.trim();
  await AsyncStorage.setItem(STORAGE_KEY, normalised);
  await switchToWifi(normalised);
}

async function switchToWifi(url: string) {
  await safeDisconnect();
  currentImpl = new WifiBeltService({ baseUrl: url });
}

function switchToMock() {
  currentImpl = new MockBeltService();
}

async function safeDisconnect() {
  try { await currentImpl.disconnect(); } catch { /* ignore */ }
}

export type BeltTransport = 'mock' | 'wifi';
export function getBeltTransport(): BeltTransport {
  return currentImpl instanceof WifiBeltService ? 'wifi' : 'mock';
}

export * from './types';
export * from './constants';

