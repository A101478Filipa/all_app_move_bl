import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/**
 * Navigate to a screen from outside a React component (e.g. notification handler).
 * Uses CommonActions.navigate so it works regardless of stack depth.
 */
export function navigate(name: string, params?: Record<string, unknown>) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(CommonActions.navigate({ name, params }));
  }
}
