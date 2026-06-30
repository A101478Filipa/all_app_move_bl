export type ImuSample = {
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
  /** Local timestamp (ms epoch) when the sample was received. */
  timestamp: number;
};

export type BeltConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'streaming'
  | 'error';

export type BeltStatus = {
  state: BeltConnectionState;
  /** Free-form info (last error, packets received, etc.). */
  message?: string;
  samplesReceived: number;
};

export interface BeltService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  /** Writes the file name the belt will use on its SD card. */
  sendFileName(name: string): Promise<void>;
  /** Sends START_STREAM and begins emitting samples to listeners. */
  startStream(): Promise<void>;
  /** Sends STOP_STREAM. */
  stopStream(): Promise<void>;

  /**
   * Lists files currently stored on the belt SD card.
   * Wi-Fi: actual list from the firmware. Mock: returns a stub.
   */
  listFiles(): Promise<Array<{ name: string; size: number }>>;

  /**
   * Downloads the raw binary content of a file from the belt SD card.
   * The bytes are the contiguous IMU stream (24 B per sample, 6 LE float32).
   */
  downloadFile(name: string): Promise<Uint8Array>;

  /** Optional: delete a file from the belt SD card. May throw if unsupported. */
  deleteFile?(name: string): Promise<void>;

  /** Subscribe to IMU samples. Returns unsubscribe fn. */
  onSample(listener: (sample: ImuSample) => void): () => void;
  /** Subscribe to status changes. Returns unsubscribe fn. */
  onStatus(listener: (status: BeltStatus) => void): () => void;

  getStatus(): BeltStatus;
}
