import { BeltService, BeltStatus, ImuSample } from './types';

/**
 * Wi-Fi (HTTP) transport for the IMU belt.
 *
 * The belt (Arduino Nano 33 IoT with WiFiNINA) exposes a tiny HTTP server.
 * The Arduino is expected to be reachable at a known IPv4 + port on the same
 * local network as the phone.
 *
 * Default HTTP contract (adjust to match the firmware):
 *
 *   GET  /status              -> 200 { "state": "idle" | "streaming", "samples": <int>, "lastFile": "..." }
 *   POST /filename            -> 200 { "ok": true }
 *                                 body: { "name": "LSJ_JOAOSILVA_T03" }
 *   POST /start               -> 200 { "ok": true }                       (equivalent to BLE 0x01)
 *   POST /stop                -> 200 { "ok": true }                       (equivalent to BLE 0x00)
 *   POST /power-off           -> 200 { "ok": true }                       (equivalent to BLE 0x02, optional)
 *
 * If your firmware uses different paths/verbs, change the `endpoints` field
 * when constructing the service.
 *
 * Notes:
 *  - We poll /status every few seconds while streaming to update the sample
 *    counter shown in the UI. We do NOT stream raw IMU samples to the phone
 *    over Wi-Fi — the belt writes them to its SD card and we only need
 *    aggregate progress.
 */
export type WifiBeltConfig = {
  /** e.g. "http://192.168.1.50" or "http://192.168.1.50:80" */
  baseUrl: string;
  /** Per-request timeout, ms. */
  requestTimeoutMs?: number;
  /** Status poll interval while streaming, ms. */
  statusPollMs?: number;
  endpoints?: Partial<{
    status: string;
    filename: string;
    start: string;
    stop: string;
    powerOff: string;
  }>;
};

const DEFAULT_ENDPOINTS = {
  status:   '/status',
  filename: '/filename',
  start:    '/start',
  stop:     '/stop',
  powerOff: '/power-off',
} as const;

export class WifiBeltService implements BeltService {
  private cfg: Required<Omit<WifiBeltConfig, 'endpoints'>> & {
    endpoints: typeof DEFAULT_ENDPOINTS;
  };
  private sampleListeners = new Set<(s: ImuSample) => void>();
  private statusListeners = new Set<(s: BeltStatus) => void>();
  private status: BeltStatus = { state: 'disconnected', samplesReceived: 0 };
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastFileName: string | null = null;

  constructor(config: WifiBeltConfig) {
    this.cfg = {
      baseUrl: config.baseUrl.replace(/\/+$/, ''),
      requestTimeoutMs: config.requestTimeoutMs ?? 5000,
      statusPollMs: config.statusPollMs ?? 1000,
      endpoints: { ...DEFAULT_ENDPOINTS, ...(config.endpoints ?? {}) },
    };
  }

  private setStatus(partial: Partial<BeltStatus>) {
    this.status = { ...this.status, ...partial };
    for (const l of this.statusListeners) l(this.status);
  }

  private async request<T = any>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.cfg.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.cfg.requestTimeoutMs);
    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText} on ${path}`);
      }
      const text = await res.text();
      return (text ? JSON.parse(text) : {}) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async connect(): Promise<void> {
    this.setStatus({ state: 'connecting', message: `Wi-Fi: ${this.cfg.baseUrl}` });
    try {
      const s = await this.request<{ state?: string; samples?: number; lastFile?: string }>(
        this.cfg.endpoints.status,
        { method: 'GET' },
      );
      const streaming = s?.state === 'streaming';
      this.setStatus({
        state: streaming ? 'streaming' : 'connected',
        message: streaming ? `Already streaming → ${s?.lastFile ?? ''}` : 'Belt online',
        samplesReceived: s?.samples ?? 0,
      });
      if (streaming) this.startPolling();
    } catch (err: any) {
      this.setStatus({ state: 'error', message: err?.message ?? 'Failed to reach belt' });
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    this.stopPolling();
    this.setStatus({ state: 'disconnected', message: 'Wi-Fi disconnected', samplesReceived: 0 });
  }

  async sendFileName(name: string): Promise<void> {
    await this.request(this.cfg.endpoints.filename, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    this.lastFileName = name;
    this.setStatus({ message: `File name set → ${name}` });
  }

  async startStream(): Promise<void> {
    if (this.status.state !== 'connected') {
      throw new Error('Belt is not connected');
    }
    await this.request(this.cfg.endpoints.start, { method: 'POST' });
    this.setStatus({
      state: 'streaming',
      samplesReceived: 0,
      message: this.lastFileName ? `Streaming → ${this.lastFileName}` : 'Streaming',
    });
    this.startPolling();
  }

  async stopStream(): Promise<void> {
    try {
      await this.request(this.cfg.endpoints.stop, { method: 'POST' });
    } finally {
      this.stopPolling();
      if (this.status.state === 'streaming') {
        this.setStatus({ state: 'connected', message: 'Streaming stopped' });
      }
    }
  }

  async listFiles(): Promise<Array<{ name: string; size: number }>> {
    const res = await this.request<{ files?: Array<{ name: string; size: number }> }>(
      '/files', { method: 'GET' },
    );
    return res?.files ?? [];
  }

  async downloadFile(name: string): Promise<Uint8Array> {
    const url = `${this.cfg.baseUrl}/file/${encodeURIComponent(name)}`;
    const controller = new AbortController();
    // Large file: use a generous timeout (30 s) regardless of request default.
    const timeoutId = setTimeout(() => controller.abort(), Math.max(this.cfg.requestTimeoutMs, 30000));
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} on /file/${name}`);
      const ab = await res.arrayBuffer();
      return new Uint8Array(ab);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async deleteFile(name: string): Promise<void> {
    await this.request(`/file/${encodeURIComponent(name)}`, { method: 'DELETE' });
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

  private startPolling() {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(async () => {
      try {
        const s = await this.request<{ state?: string; samples?: number }>(
          this.cfg.endpoints.status,
          { method: 'GET' },
        );
        if (typeof s?.samples === 'number' && s.samples !== this.status.samplesReceived) {
          this.setStatus({ samplesReceived: s.samples });
        }
        if (s?.state && s.state !== 'streaming' && this.status.state === 'streaming') {
          this.setStatus({ state: 'connected', message: 'Belt stopped streaming' });
          this.stopPolling();
        }
      } catch {
        // transient polling errors are ignored; explicit calls will surface real failures
      }
    }, this.cfg.statusPollMs);
  }

  private stopPolling() {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
  }
}
