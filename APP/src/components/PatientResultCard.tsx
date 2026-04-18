import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Animated, TouchableOpacity } from 'react-native';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { shadowStyles } from '@src/styles/shadow';
import { MaterialIcons } from '@expo/vector-icons';
import { Spaced, VStack } from '@components/CoreComponents';
import { buildAvatarUrl } from '@src/services/ApiService';
import { calculateAge } from '@src/utils/Date';
import { getGenderTitle } from '@src/utils/genderHelper';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { dataAccessRequestApi } from '@src/api/endpoints/dataAccessRequest';
import Toast from 'react-native-toast-message';
import { PrimaryButton } from '@components/ButtonComponents';

interface PatientData {
  id: number;
  medicalId: number;
  name: string;
  birthDate: Date;
  gender: string;
  user: {
    avatarUrl?: string;
  };
  // Full access fields
  email?: string;
  phone?: string;
  address?: string;
  institution?: {
    id: number;
    name: string;
  };
  hasFullAccess?: boolean;
  accessRequest?: {
    id: number;
    status: 'PENDING' | 'APPROVED' | 'DENIED' | 'REVOKED';
    requestedAt: Date;
    respondedAt?: Date;
  };
}

interface PatientResultCardProps {
  patient: PatientData;
  fadeAnim: Animated.Value;
  onAccessRequested?: () => void;
  onPatientPress?: () => void;
}

export const PatientResultCard: React.FC<PatientResultCardProps> = ({ patient, fadeAnim, onAccessRequested, onPatientPress }) => {
  const { t } = useTranslation();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestAccess = async () => {
    setIsRequesting(true);
    try {
      await dataAccessRequestApi.createRequest({
        elderlyId: patient.id,
        notes: 'Requesting access to patient medical records',
      });

      Toast.show({
        type: 'success',
        text1: t('searchElderly.accessRequested'),
        text2: t('searchElderly.accessRequestedMessage'),
      });

      onAccessRequested?.();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t('searchElderly.requestFailed'),
        text2: error.response?.data?.message || t('searchElderly.failedToRequestAccess'),
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const hasFullAccess = patient.hasFullAccess !== false;
  const accessRequest = patient.accessRequest;

  const CardContent = (
    <>
      {/* Medical ID Badge */}
      <View style={styles.medicalIdBadge}>
        <MaterialIcons name="badge" size={16} color={Color.primary} />
        <Text style={styles.medicalIdText}>ID: {patient.medicalId}</Text>
      </View>

      {/* Header with Avatar and Name */}
      <View style={styles.header}>
        <Image
          source={{ uri: buildAvatarUrl(patient.user.avatarUrl) }}
          style={styles.avatar}
        />
        <VStack spacing={Spacing.xs_4} align="flex-start" style={{ flex: 1 }}>
          <Text style={styles.name}>{patient.name}</Text>
          <Text style={styles.subtitle}>
            {calculateAge(patient.birthDate)} {t('searchElderly.yearsOld')} • {getGenderTitle(patient.gender as any, t)}
          </Text>
        </VStack>
        {hasFullAccess && (
          <MaterialIcons name="chevron-right" size={28} color={Color.Gray.v300} />
        )}
      </View>

      {/* Access Status */}
      <VStack spacing={Spacing.md_16} style={{flex: 1, alignSelf: 'stretch'}}>
        {accessRequest && (
          <View style={[
            styles.statusChip,
            { backgroundColor: getStatusColor(accessRequest.status) }
          ]}>
            <MaterialIcons
              name={getStatusIcon(accessRequest.status)}
              size={14}
              color={Color.white}
            />
            <Text style={styles.statusText}>{getStatusText(accessRequest.status, t)}</Text>
          </View>
        )}

        {/* Locked Section - Only show if no access */}
        {!hasFullAccess && (
          <VStack style={styles.lockedSection}>
            <MaterialIcons name="lock-outline" size={32} color={Color.Gray.v300} />
            <Spaced height={Spacing.sm_8} />
            <Text style={styles.lockedText}>{t('searchElderly.medicalDataPrivate')}</Text>

            {(!accessRequest || accessRequest.status === 'DENIED') && (
              <PrimaryButton
                title={isRequesting ? t('searchElderly.requesting') :
                  (accessRequest?.status === 'DENIED' ? t('searchElderly.requestAgain') : t('searchElderly.requestAccess'))}
                onPress={handleRequestAccess}
                loading={isRequesting}
                icon={<MaterialIcons name="vpn-key" size={18} color={Color.white} />}
                style={styles.requestAccessButton}
              />
            )}
          </VStack>
        )}
      </VStack>
    </>
  );

  return (
    <Animated.View style={{ opacity: fadeAnim, alignSelf: 'stretch' }}>
      <VStack spacing={Spacing.md_16} style={{ alignSelf: 'stretch' }}>
        {/* Main Card */}
        {hasFullAccess ? (
          <TouchableOpacity
            style={styles.card}
            onPress={onPatientPress}
            activeOpacity={0.7}
          >
            {CardContent}
          </TouchableOpacity>
        ) : (
          <View style={styles.card}>
            {CardContent}
          </View>
        )}
      </VStack>
    </Animated.View>
  );
};

// Helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING': return Color.Orange.v300;
    case 'APPROVED': return Color.Cyan.v400;
    case 'DENIED': return Color.Orange.v400;
    case 'REVOKED': return Color.Gray.v400;
    default: return Color.Gray.v300;
  }
};

const getStatusIcon = (status: string): keyof typeof MaterialIcons.glyphMap => {
  switch (status) {
    case 'PENDING': return 'schedule';
    case 'APPROVED': return 'check-circle';
    case 'DENIED': return 'cancel';
    case 'REVOKED': return 'block';
    default: return 'info';
  }
};

const getStatusText = (status: string, t: any) => {
  switch (status) {
    case 'PENDING': return t('searchElderly.statusPending');
    case 'APPROVED': return t('searchElderly.statusApproved');
    case 'DENIED': return t('searchElderly.statusDenied');
    case 'REVOKED': return t('searchElderly.statusRevoked');
    default: return status;
  }
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Color.white,
    borderRadius: Border.lg_16,
    paddingTop: Spacing.sm_8,
    paddingBottom: Spacing.md_16,
    paddingHorizontal: Spacing.md_16,
    alignSelf: 'stretch',
    ...shadowStyles.cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: Spacing.md_12,
    gap: Spacing.md_16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Color.primary,
  },
  name: {
    fontSize: FontSize.bodylarge_18,
    fontFamily: FontFamily.bold,
    color: Color.dark,
  },
  subtitle: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
  },
  medicalIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: `${Color.primary}10`,
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_8,
    borderRadius: Border.xl_24,
    gap: Spacing.sm_8,
    marginTop: Spacing.sm_8,
  },
  medicalIdText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.bold,
    color: Color.primary,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: Spacing.md_12,
    paddingVertical: Spacing.xs_6,
    borderRadius: Border.md_12,
    gap: Spacing.xs_4,
  },
  statusText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.bold,
    color: Color.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoGrid: {
    gap: Spacing.sm_10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm_10,
    paddingVertical: Spacing.xs_6,
  },
  infoText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.dark,
    flex: 1,
  },
  addressContainer: {
    flexDirection: 'row',
    gap: Spacing.sm_10,
    paddingVertical: Spacing.xs_6,
    paddingTop: Spacing.sm_8,
    borderTopWidth: 1,
    borderTopColor: Color.Gray.v100,
  },
  addressText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.dark,
    flex: 1,
  },
  lockedSection: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  lockedText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v400,
  },
  requestAccessButton: {
    marginTop: Spacing.md_16,
    alignSelf: 'stretch',
  },
});
