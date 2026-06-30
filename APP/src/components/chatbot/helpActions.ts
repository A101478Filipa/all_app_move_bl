import { UserRole } from 'moveplus-shared';
import { navigationRef } from '@src/services/NavigationService';
import { useAuthStore } from '@src/stores/authStore';
import { ChatbotActionId } from '@src/api/endpoints/chatbot';

type TabName =
  | 'InstitutionDashboardTab'
  | 'InstitutionMembersTab'
  | 'MenuTab'
  | 'DashboardTab'
  | 'ProfileTab'
  | 'HomepageTab'
  | 'InstitutionListTab';

const dashboardTabFor = (role?: UserRole): TabName => {
  if (role === UserRole.ELDERLY) return 'DashboardTab';
  if (role === UserRole.PROGRAMMER) return 'HomepageTab';
  return 'InstitutionDashboardTab';
};

const membersTabFor = (role?: UserRole): TabName | null => {
  if (
    role === UserRole.CAREGIVER ||
    role === UserRole.CLINICIAN ||
    role === UserRole.INSTITUTION_ADMIN
  ) return 'InstitutionMembersTab';
  if (role === UserRole.PROGRAMMER) return 'InstitutionListTab';
  return null;
};

const profileTabFor = (role?: UserRole): TabName => {
  if (role === UserRole.ELDERLY) return 'ProfileTab';
  return 'MenuTab';
};

const navigateMenu = (screen: string, params?: Record<string, unknown>) => {
  if (!navigationRef.isReady()) return;
  (navigationRef.navigate as (...args: any[]) => void)('MenuTab', { screen, params });
};

const navigateTab = (tab: TabName) => {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate(tab as never);
};

/**
 * Resolve and execute the navigation for a deep-link action returned by the
 * chatbot. Returns true if a navigation was performed.
 */
export const runHelpAction = (id: ChatbotActionId): boolean => {
  const user = useAuthStore.getState().user?.user;
  const role = user?.role as UserRole | undefined;

  switch (id) {
    case 'account.settings':
      navigateMenu('UserSettings');
      return true;

    case 'account.notifications':
      navigateMenu('NotificationCenter');
      return true;

    case 'account.invitations': {
      const institutionId = (user as { institution?: { id?: number } } | undefined)
        ?.institution?.id;
      if (!institutionId) return false;
      navigateMenu('InstitutionInvitations', { institutionId });
      return true;
    }

    case 'account.external-professionals':
      navigateMenu('ExternalProfessionalsManagement');
      return true;

    case 'account.my-schedule':
      navigateMenu('StaffScheduleManagement');
      return true;

    case 'institution.details':
      navigateMenu('InstitutionDetails');
      return true;

    case 'tab.members': {
      const tab = membersTabFor(role);
      if (!tab) return false;
      navigateTab(tab);
      return true;
    }

    case 'tab.dashboard':
      navigateTab(dashboardTabFor(role));
      return true;

    case 'tab.profile':
      navigateTab(profileTabFor(role));
      return true;

    default:
      return false;
  }
};
