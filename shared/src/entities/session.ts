export interface Session {
  id: number;
  deviceId: number;
  elderlyId: number;
  initiatedById: number;
  startTime: string;
  endTime?: string | null;
  createdAt: Date;
}