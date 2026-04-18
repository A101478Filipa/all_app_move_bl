export interface DeviceMaintenance {
  id: number;
  performedById: number;
  deviceId: number;
  performedAt: Date;
  reason?: string | null;
  createdAt: Date;
}