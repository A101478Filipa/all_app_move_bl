import React from 'react';
import { Color } from '@src/styles/colors';
import { buildAvatarUrl } from '@src/services/ApiService';
import { calculateAge, formatDateLong } from '@src/utils/Date';
import {
  Text, StyleSheet, ScrollView,
  RefreshControl, Image, TouchableOpacity, View,
} from 'react-native';
import { HStack, VStack } from '@components/CoreComponents';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Elderly, MeasurementType } from 'moveplus-shared';
import { ExpandableRow } from '@components/ProfileComponents';
import ScreenState from '@src/constants/screenState';
import { ActivityIndicatorOverlay } from '@components/ActivityIndicatorOverlay';
import { Border } from '@src/styles/borders';
import { getGenderTitle } from '@src/utils/genderHelper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '@src/localization/hooks/useTranslation';

// MARK: CategoryCard sub-component
type CategoryCardProps = {
  iconName: string;
  iconColor: string;
  title: string;
  count?: number;
  onPress: () => void;
  onAdd?: () => void;
  fullWidth?: boolean;
};

const CategoryCard = ({ iconName, iconColor, title, count, onPress, onAdd, fullWidth }: CategoryCardProps) => (
  <TouchableOpacity
    style={[styles.categoryCard, fullWidth && styles.categoryCardFull]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={styles.categoryIconContainer}>
      <View style={[styles.categoryIconWrap, { backgroundColor: iconColor + '18' }]}>
        <MaterialIcons name={iconName as any} size={28} color={iconColor} />
      </View>
      {onAdd && (
        <TouchableOpacity
          onPress={onAdd}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          style={[styles.cardAddButton, { backgroundColor: iconColor + '35' }]}
        >
          <MaterialIcons name="add" size={12} color={iconColor} />
        </TouchableOpacity>
      )}
    </View>
    <Text style={styles.categoryTitle} numberOfLines={2}>{title}</Text>
    {count !== undefined && (
      <View style={[styles.categoryBadge, { backgroundColor: iconColor }]}>
        <Text style={styles.categoryBadgeText}>{count}</Text>
      </View>
    )}
    <MaterialIcons name="chevron-right" size={18} color={Color.Gray.v300} style={styles.categoryChevron} />
  </TouchableOpacity>
);

type ElderlyDetailsComponentArgs = {
  elderly: Elderly | null;
  screenState: ScreenState;
  onRefresh: () => Promise<void> | void;
  navigation: any;
  onAddMeasurement?: () => void;
  onAddMedication?: () => void;
  onAddPathology?: () => void;
  onAddCalendarEvent?: () => void;
  onAddFall?: () => void;
  onAddWound?: () => void;
}

// MARK: Component
const ElderlyDetailsComponent = ({ screenState, elderly, onRefresh, navigation, onAddMeasurement, onAddMedication, onAddPathology, onAddCalendarEvent, onAddFall, onAddWound }: ElderlyDetailsComponentArgs) => {
  const { t } = useTranslation();

  if (screenState === ScreenState.LOADING) {
    return (
      <View style={styles.safeArea}>
        <ActivityIndicatorOverlay/>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={screenState === ScreenState.REFRESHING} onRefresh={onRefresh} />
        }
      >
        { elderly && (
          <VStack align={'flex-start'} spacing={Spacing.lg_24}>
         
            <HStack spacing={Spacing.lg_24} style={styles.header}>
              <Image source={{ uri: buildAvatarUrl(elderly.user.avatarUrl) }} style={styles.avatar}/>
              <VStack align={'flex-start'} spacing={Spacing.xs_4}>
                <Text style={styles.name}>{elderly.name}</Text>
                <Text style={styles.institution}>{elderly.institution.name}</Text>
              </VStack>
            </HStack>

            <ExpandableRow
              title={t('elderly.elderlyInfo')}
              description={`${t('common.age')}: ${calculateAge(elderly.birthDate)}, ${getGenderTitle(elderly.gender, t)}`}
              paddingHorizontal={0}
              paddingBottom={0}
            >
              <VStack align={'flex-start'} spacing={Spacing.sm_8} style={styles.infoCardContainer}>
    
                <VStack style={styles.infoCard}>
                  <HStack align="center" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                    <View style={[styles.iconContainer, { backgroundColor: Color.Semantic.measurements + '15' }]}>
                      <MaterialIcons name="cake" size={20} color={Color.Semantic.measurements} />
                    </View>
                    <VStack align="flex-start" style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>{t('common.age')}</Text>
                      <Text style={styles.infoValue}>{calculateAge(elderly.birthDate)} {t('elderly.years')}</Text>
                      <Text style={styles.infoSubtext}>{formatDateLong(elderly.birthDate)}</Text>
                    </VStack>
                  </HStack>

                  <View style={styles.infoDivider} />

                  <HStack align="center" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                    <View style={[styles.iconContainer, { backgroundColor: Color.Semantic.medication + '15' }]}>
                      <MaterialIcons name="wc" size={20} color={Color.Semantic.medication} />
                    </View>
                    <VStack align="flex-start" style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>{t('elderly.gender')}</Text>
                      <Text style={styles.infoValue}>{getGenderTitle(elderly.gender, t)}</Text>
                    </VStack>
                  </HStack>

                  {elderly.medicalId && (
                    <>
                      <View style={styles.infoDivider} />
                      <HStack align="center" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                        <View style={[styles.iconContainer, { backgroundColor: Color.Semantic.pathology + '15' }]}>
                          <MaterialIcons name="badge" size={20} color={Color.Semantic.pathology} />
                        </View>
                        <VStack align="flex-start" style={styles.infoTextContainer}>
                          <Text style={styles.infoLabel}>{t('elderly.medicalId')}</Text>
                          <Text style={styles.infoValue}>{elderly.medicalId}</Text>
                        </VStack>
                      </HStack>
                    </>
                  )}

                  {elderly.floor != null && (
                    <>
                      <View style={styles.infoDivider} />
                      <HStack align="center" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                        <View style={[styles.iconContainer, { backgroundColor: Color.primary + '15' }]}>
                          <MaterialIcons name="layers" size={20} color={Color.primary} />
                        </View>
                        <VStack align="flex-start" style={styles.infoTextContainer}>
                          <Text style={styles.infoLabel}>{t('elderly.floor')}</Text>
                          <Text style={styles.infoValue}>{t('members.floorLabel', { number: elderly.floor })}</Text>
                        </VStack>
                      </HStack>
                    </>
                  )}
                </VStack>

                {/* Contact Information Card */}
                {(elderly.address || elderly.phone || elderly.user.email) && (
                  <VStack style={styles.infoCard}>
                    {elderly.address && (
                      <>
                        <HStack align="center" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                          <View style={[styles.iconContainer, { backgroundColor: Color.Semantic.pathology + '15' }]}>
                            <MaterialIcons name="location-on" size={20} color={Color.Semantic.pathology} />
                          </View>
                          <VStack align="flex-start" style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>{t('elderly.address')}</Text>
                            <Text style={styles.infoValue}>{elderly.address}</Text>
                          </VStack>
                        </HStack>
                        {(elderly.phone || elderly.user.email) && <View style={styles.infoDivider} />}
                      </>
                    )}

                    {elderly.phone && (
                      <>
                        <HStack align="center" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                          <View style={[styles.iconContainer, { backgroundColor: Color.Cyan.v300 + '15' }]}>
                            <MaterialIcons name="phone" size={20} color={Color.Cyan.v300} />
                          </View>
                          <VStack align="flex-start" style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>{t('elderly.phone')}</Text>
                            <Text style={styles.infoValue}>{elderly.phone}</Text>
                          </VStack>
                        </HStack>
                        {elderly.user.email && <View style={styles.infoDivider} />}
                      </>
                    )}

                    {elderly.user.email && (
                      <HStack align="center" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                        <View style={[styles.iconContainer, { backgroundColor: Color.Gray.v400 + '15' }]}>
                          <MaterialIcons name="email" size={20} color={Color.Gray.v400} />
                        </View>
                        <VStack align="flex-start" style={styles.infoTextContainer}>
                          <Text style={styles.infoLabel}>{t('elderly.email')}</Text>
                          <Text style={styles.infoValue}>{elderly.user.email}</Text>
                        </VStack>
                      </HStack>
                    )}
                  </VStack>
                )}

                {elderly.emergencyContact && (
                  <VStack style={StyleSheet.flatten([styles.infoCard, styles.emergencyCard])}>
                    <HStack align="center" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                      <View style={[styles.iconContainer, { backgroundColor: Color.Error.default + '15' }]}>
                        <MaterialIcons name="emergency" size={20} color={Color.Error.default} />
                      </View>
                      <VStack align="flex-start" style={styles.infoTextContainer}>
                        <Text style={[styles.infoLabel, { color: Color.Error.default }]}>{t('elderly.emergencyContact')}</Text>
                        <Text style={styles.infoValue}>{elderly.emergencyContact}</Text>
                      </VStack>
                    </HStack>
                  </VStack>
                )}
              </VStack>
            </ExpandableRow>

            <VStack align="flex-start" spacing={Spacing.sm_12} style={styles.gridContainer}>
              <HStack spacing={Spacing.sm_12} style={styles.gridRow}>
                <CategoryCard
                  iconName="favorite"
                  iconColor={Color.Semantic.measurements}
                  title={t('elderly.measurements')}
                  count={elderly.measurements?.length ?? 0}
                  onAdd={onAddMeasurement}
                  onPress={() => navigation.push('ElderlyMeasurementsList', {
                    elderlyId: elderly.id,
                  })}
                />
                <CategoryCard
                  iconName="medication"
                  iconColor={Color.Semantic.medication}
                  title={t('elderly.medications')}
                  count={elderly.medications?.length ?? 0}
                  onAdd={onAddMedication}
                  onPress={() => navigation.push('ElderlyMedicationsList', { elderlyId: elderly.id })}
                />
              </HStack>

              <HStack spacing={Spacing.sm_12} style={styles.gridRow}>
                <CategoryCard
                  iconName="healing"
                  iconColor={Color.Semantic.pathology}
                  title={t('elderly.pathologies')}
                  count={elderly.pathologies?.length ?? 0}
                  onAdd={onAddPathology}
                  onPress={() => navigation.push('ElderlyPathologiesList', { elderlyId: elderly.id })}
                />
                <CategoryCard
                  iconName="warning"
                  iconColor="#7B1FA2"
                  title={t('elderly.fallOccurrences')}
                  count={elderly.fallOccurrences?.length ?? 0}
                  onAdd={onAddFall}
                  onPress={() => navigation.push('ElderlyFallsList', { elderlyId: elderly.id })}
                />
              </HStack>

              <HStack spacing={Spacing.sm_12} style={styles.gridRow}>
                <CategoryCard
                  iconName="sos"
                  iconColor={Color.Warning.amber}
                  title={t('sosOccurrence.title')}
                  count={elderly.sosOccurrences?.length ?? 0}
                  onPress={() => navigation.push('ElderlySOSList', { elderlyId: elderly.id })}
                />
                <CategoryCard
                  iconName="calendar-month"
                  iconColor={Color.primary}
                  title={t('navigation.calendar')}
                  onAdd={onAddCalendarEvent}
                  onPress={() => navigation.push('ElderlyCalendar', {
                    elderlyId: elderly.id,
                    elderlyName: elderly.name,
                  })}
                />
              </HStack>

              <HStack spacing={Spacing.sm_12} style={styles.gridRow}>
                <CategoryCard
                  iconName="healing"
                  iconColor={Color.Error.default}
                  title={t('woundTracking.title')}
                  count={elderly.woundTrackingCount ?? 0}
                  onAdd={onAddWound}
                  fullWidth
                  onPress={() => navigation.push('ElderlyWoundTrackingScreen', { elderlyId: elderly.id })}
                />
              </HStack>
            </VStack>
          </VStack>
        )}
      </ScrollView>
    </View>
  );
};

// MARK: Styles
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
    alignItems: 'center',
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
    color: 'gray',
  },
  infoRowContainer: {
    alignSelf: 'stretch'
  },
  infoCardContainer: {
    alignSelf: 'stretch',
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
  emergencyCard: {
    borderColor: Color.Error.default + '30',
    borderWidth: 1.5,
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
  itemEmptyText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500
  },
  gridContainer: {
    alignSelf: 'stretch',
  },
  gridRow: {
    alignSelf: 'stretch',
  },
  categoryCard: {
    flex: 1,
    backgroundColor: Color.Background.white,
    borderRadius: Border.md_12,
    padding: Spacing.md_16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    shadowColor: Color.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
  },
  categoryCardFull: {
    flex: undefined,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    paddingVertical: Spacing.sm_12,
    gap: Spacing.sm_12,
  },
  categoryIconWrap: {
    width: 52,
    height: 52,
    borderRadius: Border.sm_8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    marginTop: Spacing.sm_8,
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
    flex: 1,
  },
  categoryBadge: {
    position: 'absolute',
    top: Spacing.sm_8,
    right: Spacing.sm_8,
    minWidth: 24,
    height: 24,
    borderRadius: Border.full,
    paddingHorizontal: Spacing.xs_4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadgeText: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.bold,
    color: Color.white,
  },
  categoryChevron: {
    position: 'absolute',
    bottom: Spacing.sm_8,
    right: Spacing.sm_8,
  },
  categoryIconContainer: {
    position: 'relative',
  },
  cardAddButton: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ElderlyDetailsComponent;