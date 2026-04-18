import React from 'react';
import { ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VStack, HStack, Spacer } from '@components/CoreComponents';
import { useAuthStore } from '@src/stores/authStore';
import { buildAvatarUrl } from '@src/services/ApiService';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize, Typography } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { shadowStyles } from '@src/styles/shadow';
import { InstitutionMember } from 'moveplus-shared';
import { UserMenuStackParamList } from '@navigation/UserMenuNavigationStack';
import InfoRowComponent from '@components/InfoRowComponent';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '@src/localization/hooks/useTranslation';

type Props = NativeStackScreenProps<UserMenuStackParamList, 'InstitutionDetails'>;

const InstitutionDetailsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const institution = (user as InstitutionMember)?.institution;

  if (!institution) {
    return (
      <View style={styles.container}>
        <VStack style={styles.centerContent}>
          <MaterialIcons name="business" size={64} color={Color.Gray.v300} />
          <Text style={styles.noInstitutionText}>{t('errors.notFound')}</Text>
        </VStack>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <VStack style={styles.contentContainer} spacing={Spacing.lg_24}>
        {/* Institution Header */}
        <VStack style={styles.headerContainer} spacing={Spacing.md_16}>
          <HStack spacing={Spacing.md_16} align="center">
            <View style={styles.institutionLogoPlaceholder}>
              <MaterialIcons name="business" size={40} color={Color.Gray.v400} />
            </View>

            <VStack spacing={Spacing.xs_4} align="flex-start">
              <Text style={styles.institutionName}>{institution.name}</Text>
              <Text style={styles.institutionNickname}>{institution.nickname}</Text>
            </VStack>
          </HStack>
        </VStack>

        {/* Institution Details */}
        <VStack style={styles.detailsContainer} spacing={Spacing.sm_8}>
          <Text style={styles.sectionTitle}>{t('institution.institutionDetails')}</Text>

          {institution.address && (
            <InfoRowComponent
              iconName="location-on"
              title={t('institution.address')}
              value={institution.address}
              isLast={false}
              iconColor={Color.primary}
            />
          )}

          {institution.phone && (
            <InfoRowComponent
              iconName="phone"
              title={t('institution.phone')}
              value={institution.phone}
              isLast={false}
              iconColor={Color.primary}
            />
          )}

          {institution.email && (
            <InfoRowComponent
              iconName="email"
              title={t('institution.email')}
              value={institution.email}
              isLast={false}
              iconColor={Color.primary}
            />
          )}

          {institution.website && (
            <InfoRowComponent
              iconName="language"
              title={t('institution.website', 'Website')}
              value={institution.website}
              isLast={true}
              iconColor={Color.primary}
              iconSize={24}
            />
          )}
        </VStack>
      </VStack>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  contentContainer: {
    ...spacingStyles.screenScrollContainer,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl_32,
  },
  noInstitutionText: {
    ...Typography.bodylarge,
    color: Color.Gray.v500,
    textAlign: 'center',
    marginTop: Spacing.md_16,
  },
  headerContainer: {
    padding: Spacing.md_16,
    borderRadius: Border.lg_16,
    borderColor: Color.Gray.v100,
    borderWidth: 1,
    backgroundColor: Color.white,
    alignSelf: 'stretch',
    ...shadowStyles.cardShadow,
  },
  institutionLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: Border.md_12,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    backgroundColor: Color.Gray.v100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  institutionName: {
    fontSize: FontSize.large,
    fontFamily: FontFamily.bold,
  },
  institutionNickname: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v400,
  },
  detailsContainer: {
    padding: Spacing.md_16,
    borderRadius: Border.lg_16,
    borderColor: Color.Gray.v100,
    borderWidth: 1,
    alignSelf: 'stretch',
    backgroundColor: Color.white,
    ...shadowStyles.cardShadow,
  },
  sectionTitle: {
    fontSize: FontSize.large,
    fontFamily: FontFamily.bold,
    marginBottom: Spacing.sm_8,
  },
  statsContainer: {
    padding: Spacing.md_16,
    borderRadius: Border.lg_16,
    borderColor: Color.Gray.v100,
    borderWidth: 1,
    alignSelf: 'stretch',
    backgroundColor: Color.white,
    ...shadowStyles.cardShadow,
  },
  dateLabel: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v500,
  },
});

export default InstitutionDetailsScreen;