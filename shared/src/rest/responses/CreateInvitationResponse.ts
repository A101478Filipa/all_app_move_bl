export interface CreateInvitationResponse {
  id: string;
  email?: string;
  phone?: string;
  utenteId?: string;
  role: string;
  token: string;
  expiresAt: string;
  invitedBy: {
    id: number;
    username: string;
  };
  institution?: {
    id: number;
    name: string;
  };
}
