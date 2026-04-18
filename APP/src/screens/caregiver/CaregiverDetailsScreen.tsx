import React, { useEffect, useState, useCallback } from 'react';
import { Caregiver } from 'moveplus-shared';
import CaregiverDetailsComponent from '@components/screens/CaregiverDetailsComponent';
import ScreenState from '@src/constants/screenState';
import { caregiverApi } from '@api/endpoints/caregivers';

const CaregiverDetailsScreen = ({ route, navigation }) => {
  const { caregiverId } = route.params;
  const [caregiver, setCaregiver] = useState<Caregiver | null>(null);
  const [state, setState] = useState<ScreenState>(ScreenState.LOADING);

  const fetchData = async () => {
    try {
      if (caregiverId) {
        const res = await caregiverApi.getCaregiver(caregiverId);
        setCaregiver(res.data);
      }
    } catch (err) {
      console.error('Error fetching caregiver:', err);
    }
  };

  useEffect(() => {
    setState(ScreenState.LOADING);
    fetchData().finally(() => setState(ScreenState.IDLE));
  }, []);

  const onRefresh = useCallback(() => {
    setState(ScreenState.REFRESHING);
    fetchData().finally(() => setState(ScreenState.IDLE));
  }, []);

  return (
    <CaregiverDetailsComponent
      caregiver={caregiver}
      screenState={state}
      onRefresh={onRefresh}
      navigation={navigation}
      professionalUserId={caregiver?.user?.id}
      professionalName={caregiver?.name}
    />
  );
};

export default CaregiverDetailsScreen;
