export interface FallDetection {
  id: number;
  elderlyId: number;
  sessionId: number;
  time: string;
  location?: string | null;
  severity?: string | null;
  notes?: string | null;
  createdAt: Date;
}