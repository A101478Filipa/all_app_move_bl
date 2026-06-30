import { BeltService, BeltStatus, ImuSample } from './types';
import { BeltBleProtocol } from './constants';

/**
 * Mock implementation of the belt service. Works inside Expo Go because it has
 * no native dependencies — it just generates synthetic IMU samples at ~100 Hz
 * so the UI (timer, sample counter, history) behaves as if a real belt was
 * streaming.
 *
 * Replace with `BleBeltService` (Expo Dev Client + react-native-ble-plx) when
 * connecting to the real Arduino.
 */
export class MockBeltService implements BeltService {
  private sampleListeners = new Set<(sample: ImuSample) => void>();
  private statusListeners = new Set<(status: BeltStatus) => void>();
  private status: BeltStatus = { state: 'disconnected', samplesReceived: 0 };
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastFileName: string | null = null;
  private t = 0;

  private setStatus(partial: Partial<BeltStatus>) {
    this.status = { ...this.status, ...partial };
    for (const l of this.statusListeners) l(this.status);
  }

  async connect(): Promise<void> {
    this.setStatus({ state: 'connecting', message: 'Mock: connecting...' });
    await new Promise(res => setTimeout(res, 400));
    this.setStatus({ state: 'connected', message: 'Mock belt connected' });
  }

  async disconnect(): Promise<void> {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    this.setStatus({ state: 'disconnected', message: 'Mock belt disconnected', samplesReceived: 0 });
    this.t = 0;
  }

  async sendFileName(name: string): Promise<void> {
    this.lastFileName = name;
    this.setStatus({ message: `Mock: file name set → ${name}` });
  }

  async startStream(): Promise<void> {
    if (this.status.state !== 'connected') {
      throw new Error('Mock belt is not connected');
    }
    this.setStatus({
      state: 'streaming',
      samplesReceived: 0,
      message: this.lastFileName ? `Mock streaming → ${this.lastFileName}` : 'Mock streaming',
    });
    this.t = 0;
    const periodMs = 1000 / BeltBleProtocol.sampleRateHz;
    this.intervalId = setInterval(() => this.emitSyntheticSample(), periodMs);
  }

  async stopStream(): Promise<void> {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    if (this.status.state === 'streaming') {
      this.setStatus({ state: 'connected', message: 'Mock streaming stopped' });
    }
  }

  async listFiles(): Promise<Array<{ name: string; size: number }>> {
    return this.lastFileName
      ? [{ name: this.lastFileName, size: this.status.samplesReceived * 24 }]
      : [];
  }

  /**
   * Generates a synthetic binary payload (24 B × samples received). Matches
   * the real wire format so the upload pipeline can be exercised end-to-end
   * without the Arduino.
   */
  async downloadFile(_name: string): Promise<Uint8Array> {
    const n = Math.max(this.status.samplesReceived, 100);
    const buf = new ArrayBuffer(n * 24);
    const view = new DataView(buf);
    for (let i = 0; i < n; i++) {
      const t = i / 100;
      const off = i * 24;
      view.setFloat32(off + 0,  0.05 * Math.sin(2 * Math.PI * 1.8 * t), true);
      view.setFloat32(off + 4,  0.04 * Math.cos(2 * Math.PI * 1.8 * t), true);
      view.setFloat32(off + 8,  1 + 0.08 * Math.sin(2 * Math.PI * 1.8 * t + 0.5), true);
      view.setFloat32(off + 12, 6 * Math.sin(2 * Math.PI * 1.8 * t + 0.2), true);
      view.setFloat32(off + 16, 4 * Math.cos(2 * Math.PI * 1.8 * t), true);
      view.setFloat32(off + 20, 2 * Math.sin(2 * Math.PI * 0.9 * t), true);
    }
    return new Uint8Array(buf);
  }

  async deleteFile(_name: string): Promise<void> {
    this.lastFileName = null;
  }

  onSample(listener: (s: ImuSample) => void): () => void {
    this.sampleListeners.add(listener);
    return () => this.sampleListeners.delete(listener);
  }

  onStatus(listener: (s: BeltStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  getStatus(): BeltStatus {
    return this.status;
  }

  private emitSyntheticSample() {
    this.t += 1 / BeltBleProtocol.sampleRateHz;
    // Simulate gentle walking-like signal.
    const sample: ImuSample = {
      ax: 0.05 * Math.sin(2 * Math.PI * 1.8 * this.t),
      ay: 0.04 * Math.cos(2 * Math.PI * 1.8 * this.t),
      az: 1 + 0.08 * Math.sin(2 * Math.PI * 1.8 * this.t + 0.5),
      gx: 6 * Math.sin(2 * Math.PI * 1.8 * this.t + 0.2),
      gy: 4 * Math.cos(2 * Math.PI * 1.8 * this.t),
      gz: 2 * Math.sin(2 * Math.PI * 0.9 * this.t),
      timestamp: Date.now(),
    };
    for (const l of this.sampleListeners) l(sample);
    this.setStatus({ samplesReceived: this.status.samplesReceived + 1 });
  }
}
