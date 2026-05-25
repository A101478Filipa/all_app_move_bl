import React, { useState, useCallback, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, RefreshControl, View, Animated, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { UserMenuStackParamList } from '@navigation/UserMenuNavigationStack';
import { dataAccessRequestApi, DataAccessRequest } from '@src/api/endpoints/dataAccessRequest';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { VStack, HStack } from '@components/CoreComponents';
import { PatientResultCard } from '@components/PatientResultCard';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { MaterialIcons } from '@expo/vector-icons';
import { Border } from '@src/styles/borders';
import { useDebounce } from '@src/hooks/useDebounce';
import { shadowStyles } from '@styles/shadow';
import { useErrorHandler } from '@src/hooks/useErrorHandler';
import { useAuthStore } from '@src/stores/authStore';
import { UserRole } from 'moveplus-shared';

type RequestFilter = 'APPROVED' | 'PENDING';

type Props = NativeStackScreenProps<UserMenuStackParamList, 'DataAccessRequests'>;

type AdminRequestCardProps = {
  request: DataAccessRequest;
  onRespond: (id: number, status: 'APPROVED' | 'DENIED') => void;
};

const AdminRequestCard: React.FC<AdminRequestCardProps> = ({ request, onRespond }) => {
  const { t } = useTranslation();
  const elderlyName = request.elderly?.name ?? '?';
  const clinicianName = request.clinician?.name ?? '?';
  const requestedAt = request.requestedAt
    ? new Date(request.requestedAt).toLocaleDateString()
    : '';

  return (
    <View style={adminCardStyles.card}>
      <VStack spacing={Spacing.sm_8}>
        <Text style={adminCardStyles.elderlyName}>{elderlyName}</Text>
        <HStack spacing={Spacing.xs_4} align="center">
          <MaterialIcons name="person" size={14} color={Color.Gray.v400} />
          <Text style={adminCardStyles.meta}>
            {t('dataAccessRequest.clinicianRequesting')}: {clinicianName}
          </Text>
        </HStack>
        {requestedAt !== '' && (
          <HStack spacing={Spacing.xs_4} align="center">
            <MaterialIcons name="schedule" size={14} color={Color.Gray.v400} />
            <Text style={adminCardStyles.meta}>
              {t('dataAccessRequest.requestedOn')}: {requestedAt}
            </Text>
          </HStack>
        )}
        {request.notes ? (
          <Text style={adminCardStyles.notes}>{request.notes}</Text>
        ) : null}
        <HStack spacing={Spacing.sm_8} style={{ marginTop: Spacing.xs_4 }}>
          <TouchableOpacity
            style={[adminCardStyles.btn, adminCardStyles.approveBtn]}
            onPress={() => onRespond(request.id, 'APPROVED')}
          >
            <Text style={adminCardStyles.btnText}>{t('dataAccessRequest.approve')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[adminCardStyles.btn, adminCardStyles.denyBtn]}
            onPress={() => onRespond(request.id, 'DENIED')}
          >
            <Text style={adminCardStyles.btnText}>{t('dataAccessRequest.deny')}</Text>
          </TouchableOpacity>
        </HStack>
      </VStack>
    </View>
  );
};

const adminCardStyles = StyleSheet.create({
  card: {
    backgroundColor: Color.white,
    borderRadius: Border.lg_16,
    padding: Spacing.md_16,
    borderWidth: 1,
    borderColor: Color.Gray.v100,
    ...shadowStyles.cardShadow,
  },
  elderlyName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
  },
  meta: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
  },
  notes: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
    fontStyle: 'italic',
  },
  btn: {
    flex: 1,
    paddingVertical: Spacing.sm_8,
    borderRadius: Border.md_12,
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: Color.primary,
  },
  denyBtn: {
    backgroundColor: Color.Error.default,
  },
  btnText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.white,
  },
});

const DataAccessRequestsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { filter } = route.params;
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { handleError, handleSuccess } = useErrorHandler();
  const isAdmin = user?.user?.role === UserRole.INSTITUTION_ADMIN;
  const [allRequests, setAllRequests] = useState<DataAccessRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<DataAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await dataAccessRequestApi.getMyRequests();
      if (response.data) {
        let filtered: DataAccessRequest[];
        if (filter === 'APPROVED') {
          filtered = response.data.filter(req => req.status === 'APPROVED');
        } else {
          filtered = response.data.filter(
            req => req.status === 'PENDING' || req.status === 'DENIED' || req.status === 'REVOKED'
          );
        }
        setAllRequests(filtered);
        setFilteredRequests(filtered);
      }
    } catch (error) {
      console.error('Error fetching access requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setFilteredRequests(allRequests);
      return;
    }

    const query = debouncedSearchQuery.toLowerCase().trim();
    const filtered = allRequests.filter(request => {
      if (!request.elderly) return false;

      const nameMatch = request.elderly.name.toLowerCase().includes(query);
      const medicalIdMatch = request.elderly.medicalId.toString().includes(query);

      return nameMatch || medicalIdMatch;
    });

    setFilteredRequests(filtered);
  }, [debouncedSearchQuery, allRequests]);

  const handleAdminRespond = useCallback(async (id: number, status: 'APPROVED' | 'DENIED') => {
    try {
      await dataAccessRequestApi.respondToRequestAsCaregiver(id, { status });
      handleSuccess(
        status === 'APPROVED'
          ? t('dataAccessRequest.approvedOnBehalf')
          : t('dataAccessRequest.deniedOnBehalf')
      );
      fetchRequests();
    } catch (err) {
      handleError(err);
    }
  }, [fetchRequests, handleError, handleSuccess, t]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, [fetchRequests]);

  const handleCardPress = (elderly: any) => {
    navigation.navigate('ElderlyDetails', {
      elderlyId: elderly.id,
      name: elderly.name,
    });
  };

  const getEmptyMessage = () => {
    if (debouncedSearchQuery.trim()) {
      return t('dataAccessRequest.noResultsFound');
    }
    if (isAdmin && filter === 'PENDING') {
      return t('dataAccessRequest.noPendingForInstitution');
    }
    return filter === 'APPROVED'
      ? t('dataAccessRequest.noApprovedRequests')
      : t('dataAccessRequest.noPendingRequests');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Color.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={Color.Gray.v400} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('dataAccessRequest.searchPlaceholder')}
          placeholderTextColor={Color.Gray.v400}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <MaterialIcons
            name="clear"
            size={20}
            color={Color.Gray.v400}
            style={styles.clearIcon}
            onPress={() => setSearchQuery('')}
          />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Color.primary}
            colors={[Color.primary]}
          />
        }
      >
        <VStack style={styles.contentContainer} spacing={Spacing.md_16}>
          {filteredRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
            </View>
          ) : (
            filteredRequests.map((request) => {
              // Admin view: requests have clinician info, show approve/deny card
              if (isAdmin && filter === 'PENDING' && request.clinician) {
                return (
                  <AdminRequestCard
                    key={request.id}
                    request={request}
                    onRespond={handleAdminRespond}
                  />
                );
              }

              if (!request.elderly) return null;

              const patientData = {
                id: request.elderly.id,
                medicalId: request.elderly.medicalId,
                name: request.elderly.name,
                birthDate: request.elderly.birthDate,
                gender: request.elderly.gender,
                user: request.elderly.user,
                hasFullAccess: filter === 'APPROVED',
                accessRequest: {
                  id: request.id,
                  status: request.status,
                  requestedAt: request.requestedAt,
                  respondedAt: request.respondedAt,
                },
              };

              return (
                <PatientResultCard
                  key={request.id}
                  patient={patientData}
                  fadeAnim={new Animated.Value(1)}
                  onPatientPress={() => handleCardPress(request.elderly)}
                />
              );
            })
          )}
        </VStack>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.white,
    marginHorizontal: Spacing.lg_24,
    marginTop: Spacing.md_16,
    marginBottom: Spacing.sm_8,
    paddingHorizontal: Spacing.md_16,
    borderRadius: Border.lg_16,
    borderWidth: 1,
    borderColor: Color.Gray.v100,
    ...shadowStyles.cardShadow,
  },
  searchIcon: {
    marginRight: Spacing.sm_8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm_12,
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.black,
  },
  clearIcon: {
    marginLeft: Spacing.sm_8,
    padding: Spacing.xs_4,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg_24,
    paddingTop: Spacing.sm_8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Color.Background.subtle,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl3_48,
  },
  emptyText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
});

export default DataAccessRequestsScreen;
