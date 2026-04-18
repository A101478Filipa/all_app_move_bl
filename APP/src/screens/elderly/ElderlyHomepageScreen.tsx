import React, { useCallback, useState } from 'react';
import { useAuthStore } from '@src/stores/authStore';
import { Caregiver, Elderly, UserRole } from 'moveplus-shared';
import ElderlyDetailsComponent from '@components/screens/ElderlyDetailsComponent';
import ScreenState from '@src/constants/screenState';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ElderlyProfileStackParamList } from '@navigation/ElderlyProfileStackNavigator';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<ElderlyProfileStackParamList, 'ElderlyHomepage'>;

const ElderlyHomepageScreen: React.FC<Props> = ({ navigation }) => {
  const { user, config, refreshUser } = useAuthStore();
  const elderly = user as Elderly;
  const [state, setState] = useState<ScreenState>(ScreenState.LOADING);

  const fetchElderlyData = useCallback(async () => {
    try {
      await refreshUser({
        id: elderly.id,
        role: UserRole.ELDERLY,
        baseUrl: config.baseUrl
      });
    } catch (error) {
      console.error('Error refreshing elderly data:', error);
    }
  }, [elderly.id, config.baseUrl, refreshUser]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setState(ScreenState.LOADING);
        await fetchElderlyData();
        setState(ScreenState.IDLE);
      };

      loadData();
    }, [fetchElderlyData])
  );

  const onRefresh = useCallback(async () => {
    if (state === ScreenState.REFRESHING) return;

    setState(ScreenState.REFRESHING);
    await fetchElderlyData();
    setState(ScreenState.IDLE);
  }, [state, fetchElderlyData]);

  return (
    <SafeAreaView style={{ flex: 1}} edges={['top']}>
      <ElderlyDetailsComponent
        elderly={elderly}
        screenState={state}
        onRefresh={onRefresh}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

export default ElderlyHomepageScreen;