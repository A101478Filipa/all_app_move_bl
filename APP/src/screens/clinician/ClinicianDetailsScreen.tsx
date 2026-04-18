import React, { useEffect, useState, useCallback } from 'react';
import { Clinician } from 'moveplus-shared';
import CaregiverDetailsComponent from '@components/screens/CaregiverDetailsComponent';
import ScreenState from '@src/constants/screenState';
import { clinicianApi } from '@api/endpoints/clinicians';

const ClinicianDetailsScreen = ({ route, navigation }) => {
  const { clinicianId } = route.params;
  const [clinician, setClinician] = useState<Clinician | null>(null);
  const [state, setState] = useState<ScreenState>(ScreenState.LOADING);

  const fetchData = async () => {
    try {
      if (clinicianId) {
        const res = await clinicianApi.getClinician(clinicianId);
        setClinician(res.data);
      }
    } catch (err) {
      console.error('Error fetching clinician:', err);
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
      caregiver={clinician as any}
      screenState={state}
      onRefresh={onRefresh}
      navigation={navigation}
      professionalUserId={(clinician as any)?.user?.id}
      professionalName={(clinician as any)?.name}
    />
  );
};

export default ClinicianDetailsScreen;
