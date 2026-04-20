import React, { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { InstitutionDashboardNavigationStackParamList } from '@src/navigation/InstitutionDashboardNavigationStack';
import { InstitutionMembersNavigationStackParamList } from '@src/navigation/InstitutionMembersNavigationStack';
import { StyleSheet, ActivityIndicator, Text, View } from 'react-native';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { sosOccurrenceApi } from '@src/api/endpoints/sosOccurrences';
import SosOccurrenceDetailsComponent from '@components/screens/SosOccurrenceDetailsComponent';
import HandleSosOccurrenceComponent from '@components/screens/HandleSosOccurrenceComponent';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@src/stores/authStore';
import { UserRole } from 'moveplus-shared';

// MARK: Types
type DashboardProps = NativeStackScreenProps<
  InstitutionDashboardNavigationStackParamList,
  'SosOccurrenceScreen'
>;
type MembersProps = NativeStackScreenProps<
  InstitutionMembersNavigationStackParamList,
  'SosOccurrenceScreen'
>;
type Props = DashboardProps | MembersProps;

// MARK: Screen
const SosOccurrenceScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const occurrenceId = React.useMemo(() => {
    return route.params.occurrenceId;
  }, [route.params]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!occurrenceId) {
        setError(t('sosOccurrence.noSosOccurrenceId'));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await sosOccurrenceApi.getSosOccurrence(occurrenceId);
        setData(res.data);
      } catch (e) {
        console.error('Error fetching SOS occurrence:', e);
        setError(t('sosOccurrence.failedToLoad'));
        setData(null);
      }
      setLoading(false);
    };

    fetchDetails();
  }, [occurrenceId, t]);

  const handleSubmit = async (payload: any) => {
    if (!occurrenceId) return;

    setSubmitting(true);
    try {
      await sosOccurrenceApi.updateSosOccurrence(occurrenceId, payload);
      const res = await sosOccurrenceApi.getSosOccurrence(occurrenceId);
      setData(res.data);
    } catch (e) {
      console.error('Error handling SOS occurrence:', e);
    }
    setSubmitting(false);
  };

  const shouldShowDetailsOnly = React.useMemo(() => {
    if (!user?.user?.role) return false;
    const role = user.user.role;
    return (
      role === UserRole.CLINICIAN ||
      role === UserRole.PROGRAMMER ||
      role === UserRole.ELDERLY
    );
  }, [user]);

  if (loading) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.Warning.amber} />
          <Text style={styles.loadingText}>{t('sosOccurrence.loadingSosOccurrence')}</Text>
        </View>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || t('sosOccurrence.sosOccurrenceNotFound')}
          </Text>
        </View>
      </View>
    );
  }

  const handled = Boolean(data.handlerUserId);
  const showDetailsOnly = shouldShowDetailsOnly || handled;

  return (
    <View style={styles.safeArea}>
      {showDetailsOnly ? (
        <SosOccurrenceDetailsComponent data={data} />
      ) : (
        <HandleSosOccurrenceComponent
          onSubmit={handleSubmit}
          loading={submitting}
          sos={data}
          occurrenceId={occurrenceId}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md_16,
  },
  loadingText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v400,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg_24,
  },
  errorText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.Warning.amber,
    textAlign: 'center',
  },
});

export { SosOccurrenceScreen };
export default SosOccurrenceScreen;
