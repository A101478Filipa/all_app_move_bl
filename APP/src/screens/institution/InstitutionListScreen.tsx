import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, RefreshControl, ActivityIndicator, TextInput,
  NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { Color } from '@src/styles/colors';
import { HStack, VStack } from '@components/CoreComponents';
import ArrowForward from '@icons/generic-chev-right.svg';
import AddIcon from '@icons/generic-add.svg';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { useFocusEffect } from '@react-navigation/core';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Institution, UserRole } from 'moveplus-shared';
import ScreenState from '@src/constants/screenState';
import { useInstitutionListStore, useAuthStore } from '@src/stores';
import { useDebounce } from '@src/hooks/useDebounce';
import { shadowStyles } from '@src/styles/shadow';
import { InstitutionListNavigationStackParamList } from '../../navigation/InstitutionListNavigationStack';

type Props = NativeStackScreenProps<InstitutionListNavigationStackParamList, 'InstitutionList'>;

interface InstitutionListPageProps {
  institutions: Institution[];
  state: ScreenState;
  onRefresh: () => Promise<void>;
  onPress: (institution: Institution) => void;
  emptyState: string;
  setShadowVisible: (visible: boolean) => void;
}

// MARK: Institution List
const InstitutionListPage: React.FC<InstitutionListPageProps> = ({
  institutions,
  state,
  onRefresh,
  onPress,
  emptyState,
  setShadowVisible
}) => {
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

  const renderItem = ({ item }: { item: Institution }) => {
    return (
      <TouchableOpacity style={{ flex: 1 }} onPress={() => onPress(item)}>
        <HStack spacing={Spacing.md_16} style={styles.itemContainer}>
          <VStack spacing={Spacing.xs_4} align={'flex-start'} style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.nickname}>{item.nickname}</Text>
            {item.address && <Text style={styles.details}>{item.address}</Text>}
            {item.phone && <Text style={styles.details}>{item.phone}</Text>}
            {item.email && <Text style={styles.details}>{item.email}</Text>}
          </VStack>

          <ArrowForward width={24} height={24} fill={Color.Gray.v300} />
        </HStack>
      </TouchableOpacity>
    );
  };

  if (state === ScreenState.ERROR) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>Error loading institutions. Please try again later.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={institutions}
        keyExtractor={(item: Institution) => `institution-${item.id}`}
        renderItem={renderItem}
        onScroll={onScroll}
        scrollEventThrottle={Spacing.md_16}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={state === ScreenState.IDLE ? <Text style={styles.emptyText}>{emptyState}</Text> : null}
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
const InstitutionListScreen: React.FC<Props> = ({ navigation }) => {
  const { institutions, state, fetchInstitutions, refreshInstitutions, searchInstitutions } = useInstitutionListStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [shadowVisible, setShadowVisible] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const isProgrammer = user?.user?.role === UserRole.PROGRAMMER;

  useFocusEffect(
    useCallback(() => {
      if (debouncedSearchQuery) {
        searchInstitutions(debouncedSearchQuery);
      } else {
        fetchInstitutions();
      }
    }, [debouncedSearchQuery, fetchInstitutions, searchInstitutions])
  );

  const onSelectInstitution = (institution: Institution) => {
    navigation.push('InstitutionMembers', {
      institutionId: institution.id,
      institutionName: institution.name
    });
  };

  const onRefresh = useCallback(async () => {
    if (debouncedSearchQuery) {
      await searchInstitutions(debouncedSearchQuery);
    } else {
      await refreshInstitutions();
    }
  }, [debouncedSearchQuery, refreshInstitutions, searchInstitutions]);

  useEffect(() => {
    if (debouncedSearchQuery) {
      searchInstitutions(debouncedSearchQuery);
    } else {
      fetchInstitutions();
    }
  }, [debouncedSearchQuery, fetchInstitutions, searchInstitutions]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <TextInput
        style={[
          styles.searchBar,
          shadowVisible && shadowStyles.cardShadow
        ]}
        placeholder="Search institutions..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <InstitutionListPage
        institutions={institutions}
        state={state}
        onPress={onSelectInstitution}
        onRefresh={onRefresh}
        emptyState={
          debouncedSearchQuery
            ? `No institutions found with name "${debouncedSearchQuery}"`
            : "No institutions available"
        }
        setShadowVisible={setShadowVisible}
      />
      
      {isProgrammer && (
        <TouchableOpacity 
          style={styles.floatingButton} 
          onPress={() => navigation.navigate('AddInstitution')}
        >
          <AddIcon width={24} height={24} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default InstitutionListScreen;

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
    padding: Spacing.md_16,
    marginVertical: Spacing.sm_8,
    borderRadius: Border.lg_16,
    borderColor: Color.Gray.v100,
    borderWidth: 1,
    ...shadowStyles.cardShadow,
  },
  name: {
    flex: 1,
    fontSize: FontSize.bodylarge_18,
    fontFamily: FontFamily.bold,
    color: Color.Gray.v500,
  },
  nickname: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
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
    textAlign: 'center',
    marginTop: Spacing.xl_32,
  },
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodylarge_18,
    color: Color.Error.default,
    textAlign: 'center',
    margin: Spacing.lg_24,
  },
  floatingButton: {
    position: 'absolute',
    right: Spacing.lg_24,
    bottom: Spacing.lg_24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Color.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadowStyles.cardShadow,
    elevation: 6,
  },
});
