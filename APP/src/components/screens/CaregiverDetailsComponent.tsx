import React from 'react';
import {
  Text, ScrollView, Image,
  SafeAreaView, RefreshControl,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import { HStack, VStack } from '@components/CoreComponents';
import { buildAvatarUrl } from '@src/services/ApiService';
import { formatDateLong, calculateAge } from '@src/utils/Date';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { useTranslation } from 'react-i18next';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Color } from '@src/styles/colors';
import { ExpandableRow } from '@components/ProfileComponents';
import { MaterialIcons } from '@expo/vector-icons';
import { Caregiver, UserRole } from 'moveplus-shared';
import ScreenState from '@src/constants/screenState';
import { ActivityIndicatorOverlay } from '@components/ActivityIndicatorOverlay';
import { getGenderTitle } from '@utils/genderHelper';
import { Border } from '@styles/borders';
import { useAuthStore } from '@src/stores';

type CaregiverDetailsComponentArgs = {
  caregiver: Caregiver | null;
  screenState: ScreenState;
  onRefresh: () => Promise<void> | void;
  navigation?: any;
  /** userId of the professional whose calendar to open (their user.id, not caregiverId) */
  professionalUserId?: number;
  professionalName?: string;
}

const CaregiverDetailsComponent = (args: CaregiverDetailsComponentArgs) => {
  const { t } = useTranslation();
  const caregiver = args.caregiver;
  const state = args.screenState;
  const { user: authUser } = useAuthStore();
  const isAdmin = authUser?.user?.role === UserRole.INSTITUTION_ADMIN;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={state === ScreenState.REFRESHING} onRefresh={args.onRefresh} />
        }
      >
        {caregiver && (
          <VStack align="flex-start" spacing={Spacing.lg_24}>
            <HStack spacing={Spacing.lg_24} style={styles.header}>
              <Image source={{ uri: buildAvatarUrl(caregiver.user.avatarUrl) }} style={styles.avatar} />
              <VStack align="flex-start" spacing={Spacing.xs_4}>
                <Text style={styles.name}>{caregiver.name}</Text>
                {caregiver.institution?.name && <Text style={styles.institution}>{caregiver.institution.name}</Text>}
              </VStack>
            </HStack>

            <ExpandableRow
              title={t('caregiver.caregiverInfo')}
              description={`${t('common.age')}: ${calculateAge(caregiver.birthDate)}, ${getGenderTitle(caregiver.gender, t)}`}
              paddingHorizontal={0}
              paddingBottom={0}
            >
              <VStack align="flex-start" style={styles.infoRowContainer}>
                <VStack style={styles.infoCard}>
                  {/* Birth Date */}
                  <HStack align="center" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                    <View style={[styles.iconContainer, { backgroundColor: Color.Semantic.measurements + '15' }]}>
                      <MaterialIcons name="cake" size={20} color={Color.Semantic.measurements} />
                    </View>
                    <VStack align="flex-start" style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>{t('caregiver.birthDate')}</Text>
                      <Text style={styles.infoValue}>{calculateAge(caregiver.birthDate)} {t('caregiver.years')}</Text>
                      <Text style={styles.infoSubtext}>{formatDateLong(caregiver.birthDate)}</Text>
                    </VStack>
                  </HStack>
                  <View style={styles.infoDivider} />
                  {/* Gender */}
                  <HStack align="center" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                    <View style={[styles.iconContainer, { backgroundColor: Color.Semantic.medication + '15' }]}>
                      <MaterialIcons name="wc" size={20} color={Color.Semantic.medication} />
                    </View>
                    <VStack align="flex-start" style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>{t('caregiver.gender')}</Text>
                      <Text style={styles.infoValue}>{getGenderTitle(caregiver.gender, t)}</Text>
                    </VStack>
                  </HStack>
                  {/* Contact Info */}
                  {(caregiver.phone || caregiver.user.email) && <View style={styles.infoDivider} />}
                  {caregiver.phone && (
                    <HStack align="center" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                      <View style={[styles.iconContainer, { backgroundColor: Color.Cyan.v300 + '15' }]}>
                        <MaterialIcons name="phone" size={20} color={Color.Cyan.v300} />
                      </View>
                      <VStack align="flex-start" style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>{t('caregiver.phone')}</Text>
                        <Text style={styles.infoValue}>{caregiver.phone}</Text>
                      </VStack>
                    </HStack>
                  )}
                  {caregiver.user.email && (
                    <>
                      {caregiver.phone && <View style={styles.infoDivider} />}
                      <HStack align="center" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                        <View style={[styles.iconContainer, { backgroundColor: Color.Gray.v400 + '15' }]}>
                          <MaterialIcons name="email" size={20} color={Color.Gray.v400} />
                        </View>
                        <VStack align="flex-start" style={styles.infoTextContainer}>
                          <Text style={styles.infoLabel}>{t('caregiver.email')}</Text>
                          <Text style={styles.infoValue}>{caregiver.user.email}</Text>
                        </VStack>
                      </HStack>
                    </>
                  )}
                </VStack>
              </VStack>
            </ExpandableRow>

            {/* Calendar button — visible to admins only */}
            {isAdmin && args.navigation && args.professionalUserId != null && (
              <TouchableOpacity
                style={styles.calendarButton}
                onPress={() => args.navigation.push('ProfessionalCalendar', {
                  userId: args.professionalUserId,
                  professionalName: args.professionalName ?? caregiver.name,
                })}
                activeOpacity={0.8}
              >
                <HStack spacing={Spacing.sm_8} align="center">
                  <View style={styles.calendarIconWrapper}>
                    <MaterialIcons name="calendar-month" size={30} color={Color.white} />
                  </View>
                  <VStack align="flex-start" style={{ flex: 1 }} spacing={Spacing.xs_4}>
                    <Text style={styles.calendarButtonTitle}>{t('navigation.calendar')}</Text>
                    <Text style={styles.calendarButtonSubtitle}>{t('dashboard.myCalendarSubtitle')}</Text>
                  </VStack>
                  <MaterialIcons name="chevron-right" size={22} color={'rgba(255,255,255,0.8)'} />
                </HStack>
              </TouchableOpacity>
            )}
          </VStack>
        )}
      </ScrollView>

      {state === ScreenState.LOADING && <ActivityIndicatorOverlay/>}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Color.Background.subtle
  },
  scrollContainer: {
    flexGrow: 1,
    ...spacingStyles.screenScrollContainer,
  },
  header: {
    alignItems: 'center'
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: Border.full,
  },
  name: {
    fontSize: FontSize.large,
    fontFamily: FontFamily.bold
  },
  institution: {
    fontSize: 16,
    color: 'gray'
  },
  infoRowContainer: {
    alignSelf: 'stretch'
  },
  infoCard: {
    backgroundColor: Color.Background.white,
    borderRadius: Border.md_12,
    padding: Spacing.md_16,
    shadowColor: Color.dark,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
  },
  infoCardRow: {
    alignItems: 'center',
    minHeight: 44,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: Border.sm_8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v400,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
  },
  infoSubtext: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
    marginTop: 2,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Color.Gray.v200,
    marginVertical: Spacing.sm_8,
    marginHorizontal: Spacing.xs_4,
  },
  calendarButton: {
    alignSelf: 'stretch',
    backgroundColor: Color.primary,
    borderRadius: Border.md_12,
    padding: Spacing.md_16,
  },
  calendarIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: Border.sm_8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarButtonTitle: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.white,
  },
  calendarButtonSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: 'rgba(255,255,255,0.75)',
  },
});

export default CaregiverDetailsComponent;
