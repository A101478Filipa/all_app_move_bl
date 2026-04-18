import React, { useLayoutEffect, useState, useEffect, useCallback } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Medication, UserRole, MedicationStatus } from 'moveplus-shared';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { HStack, VStack } from '@components/CoreComponents';
import InfoRowComponent from '@components/InfoRowComponent';
import { formatDateLong } from '@src/utils/Date';
import { MaterialIcons } from '@expo/vector-icons';
import { Border } from '@src/styles/borders';
import { shadowStyles } from '@styles/shadow';
import { useAuthStore } from '@stores/authStore';
import { useTranslation } from 'react-i18next';
import { medicationApi } from '@src/api/endpoints/medications';
import { ActivityIndicatorOverlay } from '@components/ActivityIndicatorOverlay';
import { useErrorHandler } from '@hooks/useErrorHandler';
import ScreenState from '@constants/screenState';

type MedicationDetailsScreenProps = NativeStackScreenProps<any, 'MedicationDetails'>;

interface MedicationDetailsScreenRouteParams {
  medicationId: number;
}

const MedicationDetailsScreen: React.FC<MedicationDetailsScreenProps> = ({ route, navigation }) => {
  const { medicationId } = route.params as MedicationDetailsScreenRouteParams;
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();

  const [medication, setMedication] = useState<Medication | null>(null);
  const [state, setState] = useState<ScreenState>(ScreenState.LOADING);

  const fetchMedication = async () => {
    try {
      setState(ScreenState.LOADING);
      const response = await medicationApi.getMedication(medicationId);
      setMedication(response.data);
      setState(ScreenState.IDLE);
    } catch (error) {
      console.error('Failed to fetch medication:', error);
      handleError(error, t('medication.failedToLoadMedication'));
      setState(ScreenState.ERROR);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMedication();
    }, [medicationId])
  );

  const canEditMedication = user && (
    user.user.role === UserRole.INSTITUTION_ADMIN ||
    user.user.role === UserRole.CLINICIAN ||
    user.user.role === UserRole.PROGRAMMER
  );

  const getMedicationStatusLabel = (status?: MedicationStatus | string | null) => {
    if (!status) return '';

    switch (status.toString().toUpperCase()) {
      case MedicationStatus.ACTIVE:
        return t('medication.statusOptions.active');
      case MedicationStatus.INACTIVE:
        return t('medication.statusOptions.inactive');
      case MedicationStatus.PAUSED:
        return t('medication.statusOptions.paused');
      case MedicationStatus.DISCONTINUED:
        return t('medication.statusOptions.discontinued');
      case MedicationStatus.COMPLETED:
        return t('medication.statusOptions.completed');
      default:
        return status.toString();
    }
  };

  const handleEditPress = () => {
    if (medication?.elderlyId) {
      navigation.push('EditMedication', {
        medication,
        elderlyId: medication.elderlyId
      });
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        if (canEditMedication && medication?.elderlyId) {
          return (
            <TouchableOpacity onPress={handleEditPress} style={styles.headerEditButton}>
              <MaterialIcons name="settings" size={24} color={Color.primary} />
            </TouchableOpacity>
          );
        }
        return null;
      },
    });
  }, [navigation, canEditMedication, medication, handleEditPress]);

  const getStatusColor = (status?: MedicationStatus | string | null) => {
    switch (status?.toString().toUpperCase()) {
      case MedicationStatus.ACTIVE:
        return Color.Cyan.v500;
      case MedicationStatus.INACTIVE:
        return Color.Gray.v400;
      case MedicationStatus.PAUSED:
        return Color.Warning.orange;
      case MedicationStatus.DISCONTINUED:
        return Color.Error.default;
      case MedicationStatus.COMPLETED:
        return Color.Cyan.v500;
      default:
        return Color.Gray.v400;
    }
  };

  const getStatusBadgeStyle = (status?: string | null) => ({
    ...styles.statusBadge,
    backgroundColor: getStatusColor(status),
  });

  if (state === ScreenState.LOADING) {
    return <ActivityIndicatorOverlay />;
  }

  if (state === ScreenState.ERROR || !medication) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <VStack align="center" style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={Color.Error.default} />
          <Text style={styles.errorText}>{t('medication.failedToLoadMedication')}</Text>
        </VStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <VStack align="flex-start" spacing={Spacing.lg_24}>
          {/* Header */}
          <VStack align="flex-start" spacing={Spacing.sm_8} style={styles.header}>
            <HStack align="center" spacing={Spacing.sm_8}>
              <MaterialIcons name="medication" size={24} color={Color.primary} />
              <Text style={styles.medicationName}>{medication.name}</Text>
              {medication.status && (
                <VStack style={getStatusBadgeStyle(medication.status)}>
                  <Text style={styles.statusText}>{getMedicationStatusLabel(medication.status)}</Text>
                </VStack>
              )}
            </HStack>

            {medication.activeIngredient && (
              <Text style={styles.activeIngredient}>
                {t('medication.activeIngredient')}: {medication.activeIngredient}
              </Text>
            )}
          </VStack>

          {/* Dosage & Administration */}
          <VStack align="flex-start" spacing={Spacing.md_16} style={styles.section}>
            <Text style={styles.sectionTitle}>{t('medication.dosageAndAdministration')}</Text>

            <VStack align="flex-start" style={styles.infoContainer}>
              {medication.dosage && (
                <InfoRowComponent
                  iconName="colorize"
                  title={t('medication.dosage')}
                  value={medication.dosage}
                  isLast={!medication.frequency && !medication.administration}
                />
              )}

              {medication.frequency && (
                <InfoRowComponent
                  iconName="access-time"
                  title={t('medication.frequency')}
                  value={medication.frequency}
                  isLast={!medication.administration}
                />
              )}

              {medication.administration && (
                <InfoRowComponent
                  iconName="info"
                  title={t('medication.administration')}
                  value={medication.administration}
                  isLast={true}
                />
              )}
            </VStack>
          </VStack>

          {/* Timeline */}
          {(medication.startDate || medication.endDate) && (
            <VStack align="flex-start" spacing={Spacing.md_16} style={styles.section}>
              <Text style={styles.sectionTitle}>{t('medication.timeline')}</Text>

              <VStack align="flex-start" style={styles.infoContainer}>
                {medication.startDate && (
                  <InfoRowComponent
                    iconName="play-arrow"
                    title={t('medication.startDate')}
                    value={formatDateLong(medication.startDate)}
                    isLast={!medication.endDate}
                  />
                )}

                {medication.endDate && (
                  <InfoRowComponent
                    iconName="stop"
                    title={t('medication.endDate')}
                    value={formatDateLong(medication.endDate)}
                    isLast={true}
                  />
                )}
              </VStack>
            </VStack>
          )}

          {/* Notes */}
          {medication.notes && (
            <VStack align="flex-start" spacing={Spacing.md_16} style={styles.section}>
              <Text style={styles.sectionTitle}>{t('medication.notes')}</Text>

              <VStack align="flex-start" style={styles.infoContainer}>
                <InfoRowComponent
                  iconName="note"
                  title={t('medication.notes')}
                  value={medication.notes}
                  isLast={true}
                />
              </VStack>
            </VStack>
          )}

          {/* Created Date */}
          <VStack align="flex-start" spacing={Spacing.md_16} style={styles.section}>
            <Text style={styles.sectionTitle}>{t('medication.created')}</Text>

            <VStack align="flex-start" style={styles.infoContainer}>
              <InfoRowComponent
                iconName="add-circle"
                title={t('medication.created')}
                value={formatDateLong(medication.createdAt)}
                isLast={true}
              />
            </VStack>
          </VStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  scrollContainer: {
    flexGrow: 1,
    ...spacingStyles.screenScrollContainer,
  },
  header: {
    ...shadowStyles.cardShadow,
    backgroundColor: Color.Background.white,
    borderRadius: Border.sm_8,
    padding: Spacing.md_16,
    alignSelf: 'stretch',
  },
  headerEditButton: {
    padding: Spacing.xs_4,
    marginRight: Spacing.xs_4,
  },
  medicationName: {
    fontSize: FontSize.heading2_28,
    fontFamily: FontFamily.bold,
    color: Color.dark,
  },
  activeIngredient: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
    fontStyle: 'italic',
  },
  section: {
    alignSelf: 'stretch',
  },
  sectionTitle: {
    fontSize: FontSize.heading3_24,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
  },
  infoContainer: {
    ...shadowStyles.cardShadow,
    backgroundColor: Color.Background.white,
    borderRadius: Border.sm_8,
    paddingVertical: Spacing.sm_8,
    alignSelf: 'stretch',
  },
  statusBadge: {
    borderRadius: Border.xs_4,
    paddingHorizontal: Spacing.xs_4,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: Color.white,
    textTransform: 'uppercase',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg_24,
  },
  errorText: {
    fontSize: FontSize.heading3_24,
    fontFamily: FontFamily.medium,
    color: Color.Error.default,
    textAlign: 'center',
    marginTop: Spacing.md_16,
  },
});

export default MedicationDetailsScreen;