export interface ValidateInvitationResponse {
  id: string;
  email?: string;
  phone?: string;
  utenteId?: string;
  role: string;
  institutionId?: number;
  institutionName?: string;
  invitedBy: string;
  expiresAt: string;
}
