export interface Device {
  id: number;
  name: string;
  type: string;
  serialNumber: string;
  status: string;
  lastMaintenance?: string | null;
  createdAt: Date;
  updatedAt: Date;
}