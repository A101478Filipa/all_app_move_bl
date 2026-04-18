import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, SectionList, RefreshControl, ActivityIndicator, TextInput,
  NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Color } from '@src/styles/colors';
import { buildAvatarUrl } from '@src/services/ApiService';
import { HStack, Spacer, VStack } from '@components/CoreComponents';
import ArrowForward from '@icons/generic-chev-right.svg';
import AddIcon from '@icons/generic-add.svg';
import PersonIcon from '@icons/generic-person.svg';
import { calculateAge } from '@src/utils/Date';
import { calculateFallRiskScore, getFallRiskLevel, getFallRiskColor } from '@src/utils/fallRiskCalculator';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { useFocusEffect } from '@react-navigation/core';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getGenderTitle } from '@src/utils/genderHelper';
import { initUserRole, getTitle as getRoleTitle } from '@utils/userRoleHelper';
import { Elderly, Caregiver, InstitutionAdmin, Clinician, UserRole } from 'moveplus-shared';
import { InstitutionMembersNavigationStackParamList } from '../../navigation/InstitutionMembersNavigationStack';
import ScreenState from '@src/constants/screenState';
import { useInstitutionMembersStore, useAuthStore } from '@src/stores';
import { useDebounce } from '@src/hooks/useDebounce';
import { shadowStyles } from '@src/styles/shadow';
import { InstitutionMember } from 'moveplus-shared';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { SortModal } from '@components/SortModal';
import { MemberSortOption, SortDirection } from '@src/types/InstitutionSortOption';

type Props = NativeStackScreenProps<InstitutionMembersNavigationStackParamList, 'InstitutionMembers'>;
type Personnel = Caregiver | InstitutionAdmin | Clinician;

const Tab = createMaterialTopTabNavigator();

// MARK: MenuItem Component
interface MenuItemProps {
  icon: React.ComponentType<any>;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon: Icon, title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuItemIcon}>
      <Icon width={24} height={24} fill={Color.Gray.v400} />
    </View>

    <View style={styles.menuItemContent}>
      <Text style={styles.menuItemTitle}>{title}</Text>
      <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

interface UserListPageProps {
  users: InstitutionMember[];
  state: ScreenState;
  onRefresh: () => Promise<void>;
  onPress: (user: InstitutionMember) => void;
  emptyState: string;
  keyExtractor: (item: InstitutionMember) => string;
  setShadowVisible: (visible: boolean) => void;
  listHeaderComponent?: React.ReactElement;
}

// MARK: User List
const UserListPage: React.FC<UserListPageProps> = ({ users, state, onRefresh, onPress, emptyState, keyExtractor, setShadowVisible, listHeaderComponent }) => {
  const { t } = useTranslation();
  const scrollY = useRef(0);

  useFocusEffect(
    useCallback(() => {
      setShadowVisible(scrollY.current > Spacing.md_16);
      return () => setShadowVisible(false);
    }, [setShadowVisible])
  );

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.current = offsetY;
    setShadowVisible(offsetY > Spacing.md_16);
  };

  const renderItem = ({ item }: { item: InstitutionMember }) => {
    const role = initUserRole(item.user.role);
    
    // Calculate fall risk for elderly
    let fallRiskIndicator = null;
    if (role === UserRole.ELDERLY) {
      const riskScore = calculateFallRiskScore(item as Elderly);
      const riskLevel = getFallRiskLevel(riskScore);
      const riskColor = getFallRiskColor(riskLevel);
      const riskLabel = riskLevel === 'low' 
        ? t('members.fallRiskLow')
        : riskLevel === 'moderate'
        ? t('members.fallRiskModerate')
        : t('members.fallRiskHigh');
      
      fallRiskIndicator = (
        <View style={[styles.fallRiskBadge, { backgroundColor: riskColor }]}>
          <MaterialIcons name="warning" size={12} color={Color.white} />
          <Text style={styles.fallRiskText}>{riskLabel}</Text>
        </View>
      );
    }
    
    return (
      <TouchableOpacity style={{ flex: 1, ...shadowStyles.cardShadow }} onPress={() => onPress(item)}>
        <HStack spacing={Spacing.md_16} style={styles.itemContainer}>
          <VStack spacing={Spacing.sm_8}>
            <Text style={styles.role}>{getRoleTitle(role, t)}</Text>
            <Image source={{ uri: buildAvatarUrl(item.user.avatarUrl) }} style={styles.avatar} />
          </VStack>
          <VStack spacing={Spacing.xs_4} align={'flex-start'}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.details}>{t('common.age')}: {calculateAge(item.birthDate)}, {getGenderTitle(item.gender, t)}</Text>
            {fallRiskIndicator}
          </VStack>
          <Spacer />
          <ArrowForward width={24} height={24} fill={Color.Gray.v300} />
        </HStack>
      </TouchableOpacity>
    );
  };

  if (state === ScreenState.ERROR) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>{t('errors.serverError')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={users}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onScroll={onScroll}
        scrollEventThrottle={Spacing.md_16}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeaderComponent}
        ListEmptyComponent={state === ScreenState.IDLE ? <Text style={styles.emptyText}>{emptyState}</Text> : null}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        keyboardDismissMode='on-drag'
        refreshControl={
          <RefreshControl
            refreshing={state === ScreenState.REFRESHING}
            onRefresh={onRefresh}
          />
        }
      />
      {state === ScreenState.LOADING && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </SafeAreaView>
  );
};

// MARK: Elderly Grouped List (by floor)
interface ElderlyGroupedListProps {
  elderly: InstitutionMember[];
  state: ScreenState;
  onRefresh: () => Promise<void>;
  onPress: (user: InstitutionMember) => void;
  emptyState: string;
  setShadowVisible: (visible: boolean) => void;
  sortOption: MemberSortOption;
  sortDirection: SortDirection;
}

const ElderlyGroupedList: React.FC<ElderlyGroupedListProps> = ({ elderly, state, onRefresh, onPress, emptyState, setShadowVisible, sortOption, sortDirection }) => {
  const { t } = useTranslation();
  const scrollY = useRef(0);

  useFocusEffect(
    useCallback(() => {
      setShadowVisible(scrollY.current > Spacing.md_16);
      return () => setShadowVisible(false);
    }, [setShadowVisible])
  );

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.current = offsetY;
    setShadowVisible(offsetY > Spacing.md_16);
  };

  const sections = useMemo(() => {
    const withFloor: { [key: number]: InstitutionMember[] } = {};
    const withoutFloor: InstitutionMember[] = [];
    for (const e of elderly) {
      const floor = (e as Elderly).floor;
      if (floor != null) {
        if (!withFloor[floor]) withFloor[floor] = [];
        withFloor[floor].push(e);
      } else {
        withoutFloor.push(e);
      }
    }
    const floorSortDesc = sortOption === MemberSortOption.FLOOR && sortDirection === SortDirection.DESC;
    const result = Object.keys(withFloor)
      .map(Number)
      .sort((a, b) => floorSortDesc ? b - a : a - b)
      .map((floor) => ({
        title: t('members.floorLabel', { number: floor }),
        data: withFloor[floor],
      }));
    if (withoutFloor.length > 0) {
      result.push({ title: t('members.noFloor'), data: withoutFloor });
    }
    return result;
  }, [elderly, t, sortOption, sortDirection]);

  const renderItem = ({ item }: { item: InstitutionMember }) => {
    const role = initUserRole(item.user.role);
    const riskScore = calculateFallRiskScore(item as Elderly);
    const riskLevel = getFallRiskLevel(riskScore);
    const riskColor = getFallRiskColor(riskLevel);
    const riskLabel = riskLevel === 'low'
      ? t('members.fallRiskLow')
      : riskLevel === 'moderate'
      ? t('members.fallRiskModerate')
      : t('members.fallRiskHigh');

    return (
      <TouchableOpacity style={{ flex: 1, ...shadowStyles.cardShadow }} onPress={() => onPress(item)}>
        <HStack spacing={Spacing.md_16} style={styles.itemContainer}>
          <VStack spacing={Spacing.sm_8}>
            <Text style={styles.role}>{getRoleTitle(role, t)}</Text>
            <Image source={{ uri: buildAvatarUrl(item.user.avatarUrl) }} style={styles.avatar} />
          </VStack>
          <VStack spacing={Spacing.xs_4} align={'flex-start'}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.details}>{t('common.age')}: {calculateAge(item.birthDate)}, {getGenderTitle(item.gender, t)}</Text>
            <View style={[styles.fallRiskBadge, { backgroundColor: riskColor }]}>
              <MaterialIcons name="warning" size={12} color={Color.white} />
              <Text style={styles.fallRiskText}>{riskLabel}</Text>
            </View>
          </VStack>
          <Spacer />
          <ArrowForward width={24} height={24} fill={Color.Gray.v300} />
        </HStack>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <HStack align="center" spacing={Spacing.sm_8} style={styles.sectionHeader}>
      <MaterialIcons name="layers" size={18} color={Color.primary} />
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </HStack>
  );

  if (state === ScreenState.ERROR) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>{t('errors.serverError')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => `elderly-${item.id}`}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        onScroll={onScroll}
        scrollEventThrottle={Spacing.md_16}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={state === ScreenState.IDLE ? <Text style={styles.emptyText}>{emptyState}</Text> : null}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        keyboardDismissMode='on-drag'
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={state === ScreenState.REFRESHING}
            onRefresh={onRefresh}
          />
        }
      />
      {state === ScreenState.LOADING && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </SafeAreaView>
  );
};

// MARK: Screen
const InstitutionMembersScreen: React.FC<Props> = ({ navigation, route }) => {
  const { users, state, sortOption, sortDirection, fetchUsers, refreshUsers, searchUsers, setSortOption, sortMembers } = useInstitutionMembersStore();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [shadowVisible, setShadowVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'Elderly' | 'Personnel'>('Elderly');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const institutionId = route.params?.institutionId;
  const fallbackInstitutionId = institutionId || user?.institutionId;

  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '75%'], []);

  const open = useCallback(() => sheetRef.current?.snapToIndex(0), []);
  const close = useCallback(() => sheetRef.current?.close(), []);

  const currentUserRole = user ? initUserRole(user.user.role) : null;

  // Set up navigation header button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setSortModalVisible(true)}
          style={styles.headerButton}
        >
          <MaterialIcons name="sort" size={24} color={Color.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleAddElderly = useCallback(() => {
    close();
    if (fallbackInstitutionId) {
      navigation.navigate('RegisterElderly', { institutionId: fallbackInstitutionId });
    } else {
      console.warn('Institution ID is undefined, cannot navigate to RegisterElderly');
    }
  }, [fallbackInstitutionId, navigation, close]);

  const handleAddCaregiver = useCallback(() => {
    close();
    if (fallbackInstitutionId) {
      navigation.navigate('RegisterCaregiver', { institutionId: fallbackInstitutionId });
    } else {
      console.warn('Institution ID is undefined, cannot navigate to RegisterCaregiver');
    }
  }, [fallbackInstitutionId, navigation, close]);

  const handleGenerateElderlyInvitation = useCallback(() => {
    close();
    if (fallbackInstitutionId) {
      navigation.navigate('GenerateInvitation', {
        institutionId: fallbackInstitutionId,
        invitedRole: UserRole.ELDERLY
      });
    } else {
      console.warn('Institution ID is undefined, cannot navigate to GenerateInvitation');
    }
  }, [fallbackInstitutionId, navigation, close]);

  const handleGenerateCaregiverInvitation = useCallback(() => {
    close();
    if (fallbackInstitutionId) {
      navigation.navigate('GenerateInvitation', {
        institutionId: fallbackInstitutionId,
        invitedRole: UserRole.CAREGIVER
      });
    } else {
      console.warn('Institution ID is undefined, cannot navigate to GenerateInvitation');
    }
  }, [fallbackInstitutionId, navigation, close]);

  const onSelectUser = (user: InstitutionMember) => {
    const role = initUserRole(user.user.role);
    switch (role) {
      case UserRole.ELDERLY:
        navigation.push('ElderlyDetails', { name: user.name, elderlyId: user.id });
        break;
      case UserRole.CAREGIVER:
        navigation.push('CaregiverDetails', { name: user.name, caregiverId: user.id });
        break;
      case UserRole.CLINICIAN:
        navigation.push('ClinicianDetails', { name: user.name, clinicianId: user.id });
        break;
      case UserRole.INSTITUTION_ADMIN:
        navigation.push('InstitutionAdminDetails', { name: user.name, adminId: user.id });
        break;
      default:
        break;
    }
  };

  const onRefresh = useCallback(async () => {
    if (debouncedSearchQuery) {
      await searchUsers(debouncedSearchQuery, institutionId);
    } else {
      await refreshUsers(institutionId);
    }
  }, [debouncedSearchQuery, refreshUsers, searchUsers, institutionId]);

  useEffect(() => {
    if (debouncedSearchQuery) {
      searchUsers(debouncedSearchQuery, institutionId);
    } else {
      fetchUsers(institutionId);
    }
  }, [debouncedSearchQuery, fetchUsers, searchUsers, institutionId]);

  useFocusEffect(
    useCallback(() => {
      if (debouncedSearchQuery) {
        searchUsers(debouncedSearchQuery, institutionId);
      } else {
        fetchUsers(institutionId);
      }
    }, [debouncedSearchQuery, refreshUsers, institutionId])
  );

  const renderAddOptions = () => {
    if (currentUserRole === UserRole.PROGRAMMER) {
      return (
        <VStack spacing={Spacing.md_16}>
          <MenuItem
            icon={AddIcon}
            title={t('invitation.generateInstitutionAdminCode')}
            subtitle={t('invitation.sendInvitationCode')}
            onPress={() => {
              close();
              navigation.navigate('GenerateInvitation', {
                institutionId: fallbackInstitutionId,
                institutionName: route.params?.institutionName || '',
                invitedRole: UserRole.INSTITUTION_ADMIN
              });
            }}
          />
          <MenuItem
            icon={PersonIcon}
            title={t('invitation.viewPendingInvitations')}
            subtitle={t('invitation.managePendingAdminInvitations')}
            onPress={() => {
              close();
              navigation.navigate('InstitutionInvitations', {
                institutionId: fallbackInstitutionId
              });
            }}
          />
        </VStack>
      );
    } else if (currentUserRole === UserRole.CAREGIVER || currentUserRole === UserRole.CLINICIAN) {
      return (
        <VStack spacing={Spacing.md_16}>
          <MenuItem
            icon={AddIcon}
            title={t('invitation.generateElderlyCode')}
            subtitle={t('invitation.sendInvitationCode')}
            onPress={handleGenerateElderlyInvitation}
          />
        </VStack>
      );
    } else if (currentUserRole === UserRole.INSTITUTION_ADMIN) {
      return (
        <VStack spacing={Spacing.md_16}>
          <MenuItem
            icon={AddIcon}
            title={t('invitation.generateElderlyCode')}
            subtitle={t('invitation.sendInvitationCode')}
            onPress={handleGenerateElderlyInvitation}
          />
          <MenuItem
            icon={AddIcon}
            title={t('invitation.generateCaregiverCode')}
            subtitle={t('invitation.sendInvitationCode')}
            onPress={handleGenerateCaregiverInvitation}
          />
          <MenuItem
            icon={AddIcon}
            title={t('invitation.generateInstitutionAdminCode')}
            subtitle={t('invitation.sendInvitationCode')}
            onPress={() => {
              close();
              navigation.navigate('GenerateInvitation', {
                institutionId: fallbackInstitutionId,
                institutionName: route.params?.institutionName || '',
                invitedRole: UserRole.INSTITUTION_ADMIN
              });
            }}
          />
          <MenuItem
            icon={AddIcon}
            title={t('invitation.generateClinicianCode')}
            subtitle={t('invitation.sendInvitationCode')}
            onPress={() => {
              close();
              navigation.navigate('GenerateInvitation', {
                institutionId: fallbackInstitutionId,
                institutionName: route.params?.institutionName || '',
                invitedRole: UserRole.CLINICIAN
              });
            }}
          />
        </VStack>
      );
    }
    return null;
  };

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

  const shouldShowFloatingButton = currentUserRole === UserRole.CAREGIVER || currentUserRole === UserRole.INSTITUTION_ADMIN || currentUserRole === UserRole.PROGRAMMER || currentUserRole === UserRole.CLINICIAN;

  return (
    <View style={styles.safeArea}>
      <TextInput
        style={styles.searchBar}
        placeholder={t('members.searchMembers')}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: shadowVisible ? tabBarStyles.tabBarStyleShadow : tabBarStyles.tabBarStyle,
          tabBarIndicatorStyle: tabBarStyles.tabBarIndicatorStyle,
          tabBarLabel: ({ focused, children }) => (
            <Text style={{
              color: focused ? Color.primary : Color.Gray.v400,
              ...tabBarStyles.tabBarText,
            }}>
              {children}
            </Text>
          ),
        }}
      >
        <Tab.Screen
          name="Elderly"
          options={{ title: t('members.elderly') }}
          listeners={{ focus: () => setActiveTab('Elderly') }}
          children= {() => (
            <ElderlyGroupedList
              elderly={users.elderly}
              state={state}
              onPress={onSelectUser}
              onRefresh={onRefresh}
              emptyState={debouncedSearchQuery ? `${t('members.noMembersFound')} ${debouncedSearchQuery}` : t('members.noMembersFound')}
              setShadowVisible={setShadowVisible}
              sortOption={sortOption}
              sortDirection={sortDirection}
            />
          )}
        />
        <Tab.Screen
          name="Personnel"
          options={{ title: t('members.caregivers') }}
          listeners={{ focus: () => setActiveTab('Personnel') }}
          children={() => (
            <UserListPage
              users={sortMembers([...users.admins, ...users.caregivers, ...users.clinicians], sortOption, sortDirection) as Personnel[]}
              state={state}
              onPress={onSelectUser}
              onRefresh={onRefresh}
              emptyState={debouncedSearchQuery ? `${t('members.noMembersFound')} ${debouncedSearchQuery}` : t('members.noMembersFound')}
              keyExtractor={(item: Personnel) => `${item.user.role}-${item.id}`}
              setShadowVisible={setShadowVisible}
            />
          )}
        />
      </Tab.Navigator>

      {shouldShowFloatingButton && (
        <TouchableOpacity style={styles.floatingButton} onPress={open}>
          <AddIcon width={24} height={24} />
        </TouchableOpacity>
      )}

      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bottomSheetBackground}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={styles.sheetTitle}>{t('members.addMember')}</Text>
          {renderAddOptions()}
        </BottomSheetView>
      </BottomSheet>

      <SortModal
        visible={sortModalVisible}
        currentSort={sortOption}
        currentDirection={sortDirection}
        onClose={() => setSortModalVisible(false)}
        onSelectSort={setSortOption}
        allowedOptions={
          activeTab === 'Elderly'
            ? [MemberSortOption.NAME, MemberSortOption.AGE, MemberSortOption.FALL_RISK, MemberSortOption.FLOOR]
            : [MemberSortOption.NAME, MemberSortOption.AGE, MemberSortOption.ROLE]
        }
      />
    </View>
  );
};

export default InstitutionMembersScreen;

// MARK: Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  listContainer: {
    flexGrow: 1,
    padding: Spacing.md_16,
  },
  searchBar: {
    height: 40,
    borderColor: Color.Gray.v200,
    borderWidth: 1,
    borderRadius: Border.sm_8,
    marginHorizontal: Spacing.md_16,
    marginTop: Spacing.md_16,
    marginBottom: Spacing.sm_8,
    paddingHorizontal: Spacing.md_16,
    backgroundColor: Color.white,
    ...shadowStyles.cardShadow,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Color.white,
    opacity: 0.7
  },
  itemContainer: {
    backgroundColor: Color.white,
    padding: Spacing.sm_8,
    marginVertical: Spacing.sm_8,
    borderRadius: Border.lg_16,
    borderColor: Color.Gray.v100,
    borderWidth: 1,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: Border.full
  },
  name: {
    fontSize: FontSize.bodylarge_18,
    fontFamily: FontFamily.bold,
    color: Color.Gray.v500,
  },
  role: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.primary,
  },
  details: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodylarge_18,
    color: Color.Gray.v400,
  },
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodylarge_18,
    color: Color.Error.default,
  },
  floatingButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: Border.full,
    backgroundColor: Color.Orange.v300,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: Spacing.lg_24,
    right: Spacing.lg_24,
    ...shadowStyles.floatingButtonShadow,
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
    backgroundColor: Color.Background.cyanTint,
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
  headerButton: {
    padding: Spacing.sm_8,
    marginRight: Spacing.xs_4,
  },
  fallRiskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm_8,
    paddingVertical: 4,
    borderRadius: Border.sm_8,
    marginTop: Spacing.xs_4,
    gap: 4,
  },
  fallRiskText: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.semi_bold,
    color: Color.white,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.md_16,
    paddingTop: Spacing.md_16,
    paddingBottom: Spacing.xs_4,
  },
  sectionHeaderText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.primary,
  },
});

const tabBarStyles = StyleSheet.create({
  tabBarText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
  },
  tabBarStyle: {
    backgroundColor: Color.Background.subtle,
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  tabBarStyleShadow: {
    backgroundColor: Color.Background.subtle,
    elevation: 4,
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    shadowOffset: { width: 0, height: 2 },
  },
  tabBarIndicatorStyle: {
    backgroundColor: Color.primary,
    width: '40%',
    left: '5%',
  },
});