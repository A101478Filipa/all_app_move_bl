export interface InvitationListItem {
  id: number;
  email: string;
  role: string;
  status: string;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  invitedBy: {
    id: number;
    username: string;
    name: string;
  };
  institution?: {
    id: number;
    name: string;
  } | null;
}

export type GetInvitationsResponse = InvitationListItem[];
