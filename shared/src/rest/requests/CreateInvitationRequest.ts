export interface CreateInvitationRequest {
  email?: string;
  phone?: string;
  utenteId?: string;
  role: string;
  institutionId?: number;
  invitedById: number;
  expiresInDays?: number;
}
