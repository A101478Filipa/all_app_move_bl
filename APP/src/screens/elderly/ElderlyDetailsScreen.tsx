import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import ElderlyDetailsComponent from '../../components/screens/ElderlyDetailsComponent';
import { useElderlyDetailsStore } from '@src/stores';
import { useAuthStore } from '@src/stores/authStore';
import { StyleSheet, TouchableOpacity, View, Text, SafeAreaView } from 'react-native';
import { Border } from '@src/styles/borders';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { shadowStyles } from '@src/styles/shadow';
import { FontFamily, FontSize } from '@src/styles/fonts';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { VStack } from '@components/CoreComponents';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { MaterialIcons } from '@expo/vector-icons';
import { UserRole } from 'moveplus-shared';

// MARK: MenuItem Component
interface MenuItemProps {
  iconName: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ iconName, iconColor, title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuItemIcon, { backgroundColor: `${iconColor}20` }]}>
      <MaterialIcons name={iconName} size={24} color={iconColor} />
    </View>

    <View style={styles.menuItemContent}>
      <Text style={styles.menuItemTitle}>{title}</Text>
      <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

// MARK: Screen
const ElderlyDetailsScreen = ({ route, navigation }) => {
  const { elderlyId } = route.params;
  const { elderly, state, fetchElderly, refreshElderly, clearData } = useElderlyDetailsStore();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['75%', '100%'], []);

  const open = useCallback(() => sheetRef.current?.snapToIndex(0), []);
  const close = useCallback(() => sheetRef.current?.close(), []);

const userRole = user?.user?.role;
  const canAddData = [UserRole.INSTITUTION_ADMIN, UserRole.CAREGIVER, UserRole.CLINICIAN, UserRole.PROGRAMMER].includes(userRole as UserRole);
  const canAddMedication = [UserRole.INSTITUTION_ADMIN, UserRole.CLINICIAN, UserRole.PROGRAMMER].includes(userRole as UserRole);
  const canAddPathology = [UserRole.INSTITUTION_ADMIN, UserRole.CLINICIAN, UserRole.PROGRAMMER].includes(userRole as UserRole);
  const canEditProfile = [UserRole.INSTITUTION_ADMIN, UserRole.CAREGIVER].includes(userRole as UserRole);
  const canAddFall = [UserRole.INSTITUTION_ADMIN, UserRole.CAREGIVER, UserRole.CLINICIAN].includes(userRole as UserRole);

  useEffect(() => {
    if (canAddData || canEditProfile) {
      navigation.setOptions({
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {canEditProfile && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.navigate('EditElderly', { elderlyId, name: route.params?.name ?? '' })}
              >
                <MaterialIcons name="edit" size={24} color={Color.Background.white} />
              </TouchableOpacity>
            )}
            {canAddData && (
              <TouchableOpacity style={styles.headerButton} onPress={open}>
                <MaterialIcons name="add" size={24} color={Color.Background.white} />
              </TouchableOpacity>
            )}
          </View>
        ),
      });
    }
  }, [navigation, open, canAddData, canEditProfile, elderlyId, route.params?.name]);

  const handleAddMedication = useCallback(() => {
    close();
    navigation.navigate('AddMedication', { elderlyId });
  }, [elderlyId, navigation]);

  const handleAddMeasurement = useCallback(() => {
    close();
    navigation.navigate('AddMeasurement', { elderlyId });
  }, [elderlyId, navigation]);

  const handleAddPathology = useCallback(() => {
    close();
    navigation.navigate('AddPathology', { elderlyId });
  }, [elderlyId, navigation]);

  const handleAddCalendarEvent = useCallback(() => {
    close();
    navigation.navigate('AddCalendarEvent', { elderlyId });
  }, [elderlyId, navigation]);

  const handleAddFall = useCallback(() => {
    close();
    navigation.navigate('ElderlyFallsList', { elderlyId, openModal: true });
  }, [elderlyId, navigation, close]);

  const handleAddWound = useCallback(() => {
    close();
    navigation.navigate('ElderlyWoundTrackingScreen', { elderlyId, openModal: true });
  }, [elderlyId, navigation, close]);
  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.1}
        onPress={close}
      />
    ),
    [close]
  );

  const onRefresh = useCallback(async () => {
    if (elderlyId) {
      await refreshElderly(elderlyId);
    }
  }, [elderlyId, refreshElderly]);

  useEffect(() => {
    if (elderlyId) {
      fetchElderly(elderlyId);
    }

    return () => {
      clearData();
    };
  }, [elderlyId, fetchElderly, clearData]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Color.Background.subtle }}>
      <ElderlyDetailsComponent
        elderly={elderly}
        screenState={state}
        onRefresh={onRefresh}
        navigation={navigation}
        onAddMeasurement={canAddData ? () => navigation.navigate('AddMeasurement', { elderlyId }) : undefined}
        onAddMedication={canAddMedication ? () => navigation.navigate('AddMedication', { elderlyId }) : undefined}
        onAddPathology={canAddPathology ? () => navigation.navigate('AddPathology', { elderlyId }) : undefined}
        onAddCalendarEvent={canAddData ? () => navigation.navigate('AddCalendarEvent', { elderlyId }) : undefined}
        onAddFall={canAddFall ? handleAddFall : undefined}
        onAddWound={canAddFall ? handleAddWound : undefined}
      />

      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={ styles.bottomSheetBackground }
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={styles.sheetTitle}>{t('elderly.addHealthData')}</Text>

          <VStack spacing={Spacing.md_16}>
            <MenuItem
              iconName="monitor-heart"
              iconColor={Color.Semantic.measurements}
              title={t('measurements.addMeasurement')}
              subtitle={t('measurements.recordVitalSigns')}
              onPress={handleAddMeasurement}
            />

            {canAddMedication && (
              <MenuItem
                iconName="medication"
                iconColor={Color.Semantic.medication}
                title={t('medication.addMedication')}
                subtitle={t('medication.addNewMedication')}
                onPress={handleAddMedication}
              />
            )}

            {canAddPathology && (
              <MenuItem
                iconName="local-hospital"
                iconColor={Color.Semantic.pathology}
                title={t('pathology.addPathology')}
                subtitle={t('pathology.addNewPathology')}
                onPress={handleAddPathology}
              />
            )}

            <MenuItem
              iconName="calendar-month"
              iconColor={Color.primary}
              title={t('calendar.addEvent')}
              subtitle={t('calendar.scheduleActivity')}
              onPress={handleAddCalendarEvent}
            />

            {canAddFall && (
              <MenuItem
                iconName="warning"
                iconColor="#7B1FA2"
                title={t('elderly.addFall')}
                subtitle={t('elderly.addFallSubtitle')}
                onPress={handleAddFall}
              />
            )}

            {canAddFall && (
              <MenuItem
                iconName="healing"
                iconColor={Color.Error.default}
                title={t('woundTracking.addWound')}
                subtitle={t('woundTracking.addWoundSubtitle')}
                onPress={handleAddWound}
              />
            )}
          </VStack>
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
};

export default ElderlyDetailsScreen;

// MARK: Styles
const styles = StyleSheet.create({
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: Border.sm_8,
    backgroundColor: Color.Orange.v300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm_8,
    shadowColor: Color.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomSheetBackground: {
    backgroundColor: Color.Background.white,
    borderWidth: 2,
    borderColor: Color.primary
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg_24,
    paddingTop: Spacing.md_16,
    paddingBottom: Spacing.lg_24,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: Color.primary,
  },
  sheetTitle: {
    fontSize: FontSize.subtitle_20,
    fontFamily: FontFamily.extraBold,
    color: Color.dark,
    textAlign: 'center',
    marginBottom: Spacing.lg_24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md_16,
    backgroundColor: Color.Background.white,
    borderRadius: Border.md_12,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: Border.md_12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md_16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: FontSize.bodylarge_18,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v500,
  },
});