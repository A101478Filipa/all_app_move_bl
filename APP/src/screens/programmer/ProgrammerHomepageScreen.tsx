import React, { useCallback, useState } from 'react';
import { useAuthStore } from '@src/stores/authStore';
import { Programmer, UserRole } from 'moveplus-shared';
import ProgrammerDetailsComponent from '../../components/screens/ProgrammerDetailsComponent';
import ScreenState from '@src/constants/screenState';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { ProgrammerTabsParamList } from '../../navigation/ProgrammerRootNavigator';

type Props = BottomTabScreenProps<ProgrammerTabsParamList, 'HomepageTab'>;

const ProgrammerHomepageScreen: React.FC<Props> = () => {
  const { user, config, refreshUser } = useAuthStore();
  const [state, setState] = useState<ScreenState>(ScreenState.IDLE);

  const fetchProgrammerData = async () => {
    await refreshUser({
      id: user!.id,
      role: UserRole.PROGRAMMER,
      baseUrl: config.baseUrl,
    });
  }

  const onRefresh = useCallback(async () => {
    if (state == ScreenState.REFRESHING) return

    setState(ScreenState.REFRESHING);
    await fetchProgrammerData();
    setState(ScreenState.IDLE);
  }, [user, state]);

  return (
    <ProgrammerDetailsComponent
      programmer={user as Programmer}
      screenState={state}
      onRefresh={onRefresh}
    />
  );
};

export default ProgrammerHomepageScreen;
