import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MeasurementChart } from "@components/MeasurementChart";
import { Color } from "@styles/colors";
import { FontFamily, FontSize } from "@styles/fonts";
import { Spacing, spacingStyles } from "@styles/spacings";
import { Border } from "@styles/borders";
import { shadowStyles } from "@styles/shadow";
import { groupMeasurementsForChart } from "@utils/chartsHelper";
import { Measurement, MeasurementType, UserRole } from "moveplus-shared";
import { getMeasurementTypeLabel } from '@utils/measurementHelper';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { VStack, HStack } from "@components/CoreComponents";
import { MaterialIcons } from "@expo/vector-icons";
import { formatDate } from "@utils/Date";
import { useTranslation } from "@src/localization/hooks/useTranslation";
import { useAuthStore } from "@stores/authStore";
import { useLayoutEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { elderlyApi } from "@api/endpoints/elderly";
import Toast from "react-native-toast-message";

export type ElderlyMeasurementsArgs = {
  elderlyId: number;
  measurementType: MeasurementType;
}

type Props = {
  route: { params: ElderlyMeasurementsArgs };
  navigation: any;
};

export const ElderlyMeasurementsComponent: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { elderlyId, measurementType } = route.params;

  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  const userRole = user?.user?.role;
  const canAddData = userRole && [UserRole.INSTITUTION_ADMIN, UserRole.CAREGIVER, UserRole.CLINICIAN, UserRole.PROGRAMMER].includes(userRole);

  const fetchMeasurements = async () => {
    try {
      setLoading(true);
      const response = await elderlyApi.getMeasurementsByType(elderlyId, measurementType);
      if (response.data) {
        setMeasurements(response.data);
      }
    } catch (error) {
      console.error('Error fetching measurements:', error);
      Toast.show({
        type: 'error',
        text1: t('errors.serverError'),
        text2: t('measurements.failedToLoadMeasurement')
      });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMeasurements();
    }, [elderlyId, measurementType])
  );

  const handleAddMeasurement = () => {
    if (elderlyId) {
      navigation.navigate('AddMeasurement', {
        elderlyId,
        prefillType: measurementType
      });
    }
  };

  useLayoutEffect(() => {
    if (canAddData && elderlyId) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity style={styles.headerButton} onPress={handleAddMeasurement}>
            <MaterialIcons name="add" size={24} color={Color.Background.white} />
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, canAddData, elderlyId]);

  const handleMeasurementPress = (measurementId: number) => {
    navigation.navigate('MeasurementDetails', { measurementId });
  };

  const getMeasurementStats = (measurements: Measurement[]) => {
    if (measurements.length === 0) return null;

    const sortedMeasurements = [...measurements].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const latestMeasurement = sortedMeasurements[0];
    const oldestMeasurement = sortedMeasurements[sortedMeasurements.length - 1];

    return {
      total: measurements.length,
      latest: latestMeasurement,
      oldest: oldestMeasurement
    };
  };

  const stats = getMeasurementStats(measurements);

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <MaterialIcons name="analytics" size={64} color={Color.Gray.v300} />
      <Text style={styles.emptyStateTitle}>{t('measurements.noMeasurements')}</Text>
      <Text style={styles.emptyStateDescription}>
        {t('measurements.noMeasurementsDescription')}
      </Text>
    </View>
  );

  const getDisplayValueAndUnit = (measurement: Measurement) => {
    switch (measurement.unit) {
      case 'KILOGRAMS':
        return { value: measurement.value, unit: 'kg' };
      case 'CENTIMETERS':
        return { value: measurement.value, unit: 'cm' };
      case 'SECONDS':
        return { value: measurement.value, unit: 's' };
      case 'POINTS':
        return { value: measurement.value, unit: '' };
      default:
        return { value: measurement.value, unit: '' };
    }
  };

  const getUnitFromMeasurement = (measurement: Measurement) => {
    return getDisplayValueAndUnit(measurement).unit;
  };

  const getDisplayValue = (measurement: Measurement) => {
    return getDisplayValueAndUnit(measurement).value;
  };

  const renderStatsCard = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsCard}>
        <HStack spacing={Spacing.xs_4} style={styles.statsRow}>
          <VStack align="center" style={styles.statItem}>
            <MaterialIcons name="analytics" size={24} color={Color.Semantic.measurements} />
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>{t('measurements.totalMeasurements')}</Text>
          </VStack>

          <View style={styles.statDivider} />

          <VStack align="center" style={styles.statItem}>
            <MaterialIcons name="trending-up" size={24} color={Color.Orange.v400} />
            <Text style={styles.statNumber}>
              {getDisplayValue(stats.latest)}{getUnitFromMeasurement(stats.latest) && ` ${getUnitFromMeasurement(stats.latest)}`}
            </Text>
            <Text style={styles.statLabel}>{t('measurements.latestValue')}</Text>
          </VStack>

          <View style={styles.statDivider} />

          <VStack align="center" style={styles.statItem}>
            <MaterialIcons name="schedule" size={24} color={Color.Cyan.v500} />
            <Text style={styles.statNumber}>{formatDate(stats.latest.createdAt, 'MMM DD')}</Text>
            <Text style={styles.statLabel}>{t('measurements.latestDate')}</Text>
          </VStack>
        </HStack>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Color.Semantic.measurements} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <VStack spacing={Spacing.lg_24} style={styles.container}>
        {/* Header Section */}
        <VStack spacing={Spacing.sm_8} style={styles.headerSection}>
          <HStack align="center" spacing={Spacing.sm_8}>
            <MaterialIcons name="timeline" size={24} color={Color.Semantic.measurements} />
            <Text style={styles.screenTitle}>{t('measurements.history', { type: measurementType ? getMeasurementTypeLabel(measurementType as MeasurementType, t) : t('measurements.title') })}</Text>
          </HStack>
          <Text style={styles.screenSubtitle}>
            {t('measurements.historyDescription', { type: measurementType ? getMeasurementTypeLabel(measurementType as MeasurementType, t).toLowerCase() : t('measurements.title') })}
          </Text>
        </VStack>

        {/* Stats Card */}
        {stats && renderStatsCard()}

        {/* Charts Section */}
        {measurements.length > 0 ? (
          <VStack spacing={Spacing.md_16} style={{alignSelf: 'stretch', ...shadowStyles.cardShadow}}>
            {Object.entries(groupMeasurementsForChart(measurements)).map(
              ([type, records]) => (
                <View key={type} style={styles.chartCard}>
                  <MeasurementChart data={records} onDataPointPress={handleMeasurementPress} />
                </View>
              )
            )}
          </VStack>
        ) : (
          renderEmptyState()
        )}
      </VStack>
    </ScrollView>
  );
};

// MARK: Styles
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Color.Background.subtle,
  },
  container: {
    ...spacingStyles.screenScrollContainer,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: Border.sm_8,
    backgroundColor: Color.Orange.v300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm_8,
    shadowColor: Color.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerSection: {
    alignSelf: 'stretch',
  },
  screenTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.heading2_28,
    color: Color.dark,
  },
  screenSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v400,
    lineHeight: 22,
  },
  statsCard: {
    backgroundColor: Color.Background.white,
    borderRadius: Border.lg_16,
    padding: Spacing.lg_24,
    alignSelf: 'stretch',
    ...shadowStyles.cardShadow,
  },
  statsRow: {
    alignSelf: 'stretch',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statNumber: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.dark,
    marginTop: Spacing.xs_4,
    marginBottom: Spacing.xxs_2,
  },
  statLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Color.Gray.v200,
    marginHorizontal: Spacing.xs_4,
  },
  chartCard: {
    backgroundColor: Color.Background.white,
    borderRadius: Border.lg_16,
    padding: Spacing.lg_24,
    overflow: 'hidden',
    ...shadowStyles.cardShadow,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl_32 * 2,
    paddingHorizontal: Spacing.lg_24,
  },
  emptyStateTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.heading3_24,
    color: Color.Gray.v400,
    marginTop: Spacing.md_16,
    marginBottom: Spacing.sm_8,
  },
  emptyStateDescription: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v300,
    textAlign: 'center',
    lineHeight: 22,
  },
});
