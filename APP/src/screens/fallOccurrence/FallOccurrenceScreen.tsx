import React, { useEffect, useState } from 'react';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { InstitutionDashboardNavigationStackParamList } from "@src/navigation/InstitutionDashboardNavigationStack";
import { InstitutionMembersNavigationStackParamList } from "@src/navigation/InstitutionMembersNavigationStack";
import { StyleSheet, SafeAreaView, ActivityIndicator, Text, View } from "react-native";
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { fallOccurrenceApi } from '@src/api/endpoints/fallOccurrences';
import FallOccurrenceDetailsComponent from '@components/screens/FallOccurrenceDetailsComponent';
import HandleFallOccurrenceComponent from '@components/screens/HandleFallOccurrenceComponent';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@src/stores/authStore';
import { UserRole } from 'moveplus-shared';

// MARK: Types
// Support both navigation stacks
type DashboardProps = NativeStackScreenProps<InstitutionDashboardNavigationStackParamList, 'FallOccurrenceScreen'>;
type MembersProps = NativeStackScreenProps<InstitutionMembersNavigationStackParamList, 'FallOccurrenceScreen'>;
type HandleProps = NativeStackScreenProps<InstitutionDashboardNavigationStackParamList, 'HandleFallOccurrenceScreen'>;
type Props = DashboardProps | MembersProps | HandleProps;

// MARK: Screen
const FallOccurrenceScreen: React.FC<Props> = ({ route, navigation }) => {
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
        setError(t('fallOccurrence.noFallOccurrenceId'));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fallOccurrenceApi.getFallOccurrence(occurrenceId);
        setData(res.data);
      } catch (error) {
        console.error('Error fetching fall occurrence:', error);
        setError(t('fallOccurrence.failedToLoad'));
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
      await fallOccurrenceApi.updateFallOccurrence(occurrenceId, payload);
      const res = await fallOccurrenceApi.getFallOccurrence(occurrenceId);
      setData(res.data);
    } catch (error) {
      console.error('Error handling fall occurrence:', error);
    }
    setSubmitting(false);
  };

  const shouldShowDetailsOnly = React.useMemo(() => {
    if (!user?.user?.role) return false;
    const role = user.user.role;
    return role === UserRole.CLINICIAN ||
           role === UserRole.PROGRAMMER ||
           role === UserRole.ELDERLY;
  }, [user]);

  if (loading) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.primary} />
          <Text style={styles.loadingText}>{t('fallOccurrence.loadingFallOccurrence')}</Text>
        </View>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || t('fallOccurrence.fallOccurrenceNotFound')}
          </Text>
        </View>
      </View>
    );
  }

  const handled = Boolean(data.handlerUserId);
  const showDetailsOnly = shouldShowDetailsOnly || handled;

  const canAddPhoto = !shouldShowDetailsOnly;

  const refreshData = async () => {
    try {
      const res = await fallOccurrenceApi.getFallOccurrence(occurrenceId);
      setData(res.data);
    } catch {}
  };

  return (
    <View style={styles.safeArea}>
      {showDetailsOnly ? (
        <FallOccurrenceDetailsComponent
          data={data}
          occurrenceId={occurrenceId}
          canAddPhoto={canAddPhoto}
          onDataRefresh={refreshData}
        />
      ) : (
        <HandleFallOccurrenceComponent
          onSubmit={handleSubmit}
          loading={submitting}
          fall={data}
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
    color: Color.Error.default,
    textAlign: 'center',
  },
});

export { FallOccurrenceScreen };
export default FallOccurrenceScreen;