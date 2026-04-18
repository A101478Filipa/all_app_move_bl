import { ActivityType } from "../enums/activityType";

export interface ActivityLog {
  id: number;
  userId: number;
  type: ActivityType;
  time: string;
  createdAt: Date;
}