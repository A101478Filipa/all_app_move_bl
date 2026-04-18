export interface AcceptInvitationResponse {
  user: {
    id: number;
    username: string;
    role: string;
  };
  email: string;
  institutionId?: number;
}
