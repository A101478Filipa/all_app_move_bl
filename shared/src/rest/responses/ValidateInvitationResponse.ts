export interface ValidateInvitationResponse {
  id: string;
  email: string;
  role: string;
  institutionId?: number;
  institutionName?: string;
  invitedBy: string;
  expiresAt: string;
}
