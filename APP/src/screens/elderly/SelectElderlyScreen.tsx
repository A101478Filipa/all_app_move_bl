import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { shadowStyles } from '@src/styles/shadow';
import { useFocusEffect } from '@react-navigation/core';
import { Elderly } from 'moveplus-shared';
import { useInstitutionMembersStore } from '@src/stores';
import { buildAvatarUrl } from '@src/services/ApiService';
import { calculateAge } from '@src/utils/Date';
import { getGenderTitle } from '@src/utils/genderHelper';
import { ActivityIndicatorOverlay } from '@components/ActivityIndicatorOverlay';
import { HStack, VStack } from '@components/CoreComponents';
import ScreenState from '@src/constants/screenState';
import { InstitutionDashboardNavigationStackParamList } from '../../navigation/InstitutionDashboardNavigationStack';
import { useTranslation } from '@src/localization/hooks/useTranslation';

// Icons
import SearchIcon from '@icons/generic-person.svg';
import ArrowIcon from '@icons/generic-chev-right.svg';

type Props = NativeStackScreenProps<InstitutionDashboardNavigationStackParamList, 'SelectElderlyScreen'>;

interface ElderlyCardProps {
  elderly: Elderly;
  t: (key: string) => string;
  onPress: (elderly: Elderly) => void;
}

const ElderlyCard: React.FC<ElderlyCardProps> = ({ elderly, t,onPress }) => {
  return (
    <TouchableOpacity
      style={styles.elderlyCard}
      onPress={() => onPress(elderly)}
      activeOpacity={0.7}
    >
      <HStack spacing={Spacing.md_16} align="center">
        <Image
          source={{ uri: buildAvatarUrl(elderly.user.avatarUrl) }}
          style={styles.avatar}
        />
        <VStack align="flex-start" style={{ flex: 1 }}>
          <Text style={styles.elderlyName}>{elderly.name}</Text>
          <Text style={styles.elderlyDetails}>
            {calculateAge(elderly.birthDate)} {t('elderly.yearsOld')} • {getGenderTitle(elderly.gender, t)}
          </Text>
          <Text style={styles.elderlySubInfo}>
            {t('elderly.medicalId')}: {elderly.medicalId}
            {elderly.user.email && ` • ${elderly.user.email}`}
          </Text>
        </VStack>
        <ArrowIcon width={20} height={20} fill={Color.Gray.v400} />
      </HStack>
    </TouchableOpacity>
  );
};

const SelectElderlyScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { users, fetchUsers, refreshUsers, state } = useInstitutionMembersStore();
  const [searchQuery, setSearchQuery] = useState('');

  const calendarMode = (route.params as any)?.calendarMode as boolean | undefined;
  const selectedDate = (route.params as any)?.selectedDate as string | undefined;

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [fetchUsers])
  );

  const handleElderlySelect = useCallback(
    (elderly: Elderly) => {
      if (calendarMode) {
        navigation.navigate('AddCalendarEvent', { elderlyId: elderly.id, selectedDate });
      } else {
        navigation.navigate('AddMeasurement', { elderlyId: elderly.id });
      }
    },
    [navigation, calendarMode, selectedDate]
  );

  const handleRefresh = useCallback(() => {
    refreshUsers();
  }, [refreshUsers]);

  const filteredElderly = users.elderly.filter((elderly) =>
    elderly.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (elderly.user.email && elderly.user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderElderlyItem = useCallback(
    ({ item }: { item: Elderly }) => (
      <ElderlyCard elderly={item} t={t} onPress={handleElderlySelect} />
    ),
    [handleElderlySelect, t]
  );

  if (state === ScreenState.LOADING) {
    return <ActivityIndicatorOverlay />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchIcon width={20} height={20} fill={Color.Gray.v400} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('elderly.searchByNameOrEmail')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Color.Gray.v400}
          />
        </View>

        {/* Elderly List */}
        <FlatList
          data={filteredElderly}
          renderItem={renderElderlyItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={state === ScreenState.REFRESHING}
              onRefresh={handleRefresh}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No patients found matching your search' : 'No patients available'}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md_16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.white,
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_8,
    borderRadius: Border.lg_16,
    marginTop: Spacing.md_16,
    ...shadowStyles.cardShadow,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm_8,
    paddingVertical: Spacing.sm_8,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
  },
  listContent: {
    paddingVertical: Spacing.lg_24,
  },
  elderlyCard: {
    backgroundColor: Color.white,
    padding: Spacing.md_16,
    borderRadius: Border.lg_16,
    marginBottom: Spacing.md_16,
    ...shadowStyles.cardShadow,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: Border.full,
  },
  elderlyName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
  },
  elderlyDetails: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
    marginTop: Spacing.xs_4,
  },
  elderlySubInfo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.primary,
    marginTop: Spacing.xs_4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl5_64,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
});

export default SelectElderlyScreen;