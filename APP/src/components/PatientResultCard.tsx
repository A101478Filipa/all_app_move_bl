import React from 'react';
import { View, Text, StyleSheet, Image, Animated, TouchableOpacity } from 'react-native';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { shadowStyles } from '@src/styles/shadow';
import { MaterialIcons } from '@expo/vector-icons';
import { VStack } from '@components/CoreComponents';
import { buildAvatarUrl } from '@src/services/ApiService';
import { calculateAge } from '@src/utils/Date';
import { getGenderTitle } from '@src/utils/genderHelper';
import { useTranslation } from '@src/localization/hooks/useTranslation';

interface PatientData {
  id: number;
  medicalId: number;
  name: string;
  birthDate: Date;
  gender: string;
  user: {
    avatarUrl?: string;
  };
  email?: string;
  phone?: string;
  address?: string;
  institution?: {
    id: number;
    name: string;
  };
}

interface PatientResultCardProps {
  patient: PatientData;
  fadeAnim: Animated.Value;
  onPatientPress?: () => void;
}

export const PatientResultCard: React.FC<PatientResultCardProps> = ({ patient, fadeAnim, onPatientPress }) => {
  const { t } = useTranslation();

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
        <MaterialIcons name="chevron-right" size={28} color={Color.Gray.v300} />
      </View>
    </>
  );

  return (
    <Animated.View style={{ opacity: fadeAnim, alignSelf: 'stretch' }}>
      <VStack spacing={Spacing.md_16} style={{ alignSelf: 'stretch' }}>
        <TouchableOpacity
          style={styles.card}
          onPress={onPatientPress}
          activeOpacity={0.7}
        >
          {CardContent}
        </TouchableOpacity>
      </VStack>
    </Animated.View>
  );
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
    display: 'none',
  },
  statusText: {
    display: 'none',
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
});
