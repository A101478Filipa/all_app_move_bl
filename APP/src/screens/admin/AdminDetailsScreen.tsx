import React, { useCallback, useEffect, useState } from 'react';
import { adminApi } from '@src/api/endpoints/admin';
import InstitutionAdminDetailsComponent from '@components/screens/AdminDetailsComponent';
import ScreenState from '@src/constants/screenState';
import { InstitutionAdmin } from 'moveplus-shared';
import { StyleSheet, View } from 'react-native';
import { Border } from '@src/styles/borders';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { shadowStyles } from '@src/styles/shadow';

// MARK: Screen
const InstitutionAdminDetailsScreen = ({ route, navigation }) => {
  const { adminId } = route.params;
  const [admin, setAdmin] = useState<InstitutionAdmin | null>(null);
  const [state, setState] = useState<ScreenState>(ScreenState.LOADING);

  const fetchAdminData = async () => {
    try {
      if (adminId) {
        const res = await adminApi.getAdmin(adminId);
        setAdmin(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch institution admin data:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setState(ScreenState.REFRESHING);
    await fetchAdminData();
    setState(ScreenState.IDLE);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setState(ScreenState.LOADING);
      await fetchAdminData();
      setState(ScreenState.IDLE);
    };

    loadData();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Color.Background.subtle }}>
      <InstitutionAdminDetailsComponent
        admin={admin}
        screenState={state}
        onRefresh={onRefresh}
        navigation={navigation}
        professionalUserId={admin?.user?.id}
        professionalName={admin?.name}
      />
    </View>
  );
};

export default InstitutionAdminDetailsScreen;

// MARK: Styles
const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: Border.full,
    backgroundColor: Color.Orange.v300,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: Spacing.lg_24,
    right: Spacing.lg_24,
    ...shadowStyles.floatingButtonShadow,
  },
});
