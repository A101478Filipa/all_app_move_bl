export interface CreateInvitationRequest {
  email: string;
  role: string;
  institutionId?: number;
  invitedById: number;
  expiresInDays?: number;
}
