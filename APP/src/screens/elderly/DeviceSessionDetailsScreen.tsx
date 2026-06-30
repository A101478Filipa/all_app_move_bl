import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { useAuthStore } from '@src/stores/authStore';
import { deviceSessionApi, SamplesResponse } from '@src/api/endpoints/deviceSessions';
import { DeviceSession, UserRole } from 'moveplus-shared';
import { baseServerUrl } from '@src/services/ApiService';

type Props = NativeStackScreenProps<any, 'DeviceSessionDetails'>;

const CHART_HEIGHT = 220;
const MAX_POINTS = 300;

const formatDuration = (seconds: number): string => {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const DeviceSessionDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const role = user?.user?.role;

  const { sessionId } = (route.params ?? {}) as { sessionId?: number };

  const [session, setSession] = useState<DeviceSession | null>(null);
  const [samples, setSamples] = useState<SamplesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('deviceTests.detailsTitle') });
  }, [navigation, t]);

  useEffect(() => {
    if (!sessionId) {
      setError(t('deviceTests.errorElderlyMissing'));
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [metaRes, samplesRes] = await Promise.all([
          deviceSessionApi.get(sessionId),
          deviceSessionApi.getSamples(sessionId, { max: MAX_POINTS }),
        ]);
        if (cancelled) return;
        setSession(metaRes?.data ?? null);
        setSamples(samplesRes?.data ?? null);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Failed to load session');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId, t]);

  const accSeries = useMemo(() => buildSeries(samples, ['ax', 'ay', 'az']), [samples]);
  const gyrSeries = useMemo(() => buildSeries(samples, ['gx', 'gy', 'gz']), [samples]);

  const canDelete = useMemo(() => {
    if (!session || !user) return false;
    if (role === UserRole.PROGRAMMER || role === UserRole.INSTITUTION_ADMIN) return true;
    return user.user?.id === session.createdById;
  }, [session, user, role]);

  const handleDownload = async (kind: 'raw' | 'csv') => {
    if (!session) return;
    const path = kind === 'raw' ? deviceSessionApi.rawUrl(session.id) : deviceSessionApi.csvUrl(session.id);
    const url = `${baseServerUrl}/api/${path}`;
    try {
      await Share.share({ message: url });
    } catch {
      // user cancelled
    }
  };

  const handleDelete = () => {
    if (!session) return;
    Alert.alert(
      t('deviceTests.deleteConfirmTitle'),
      t('deviceTests.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deviceSessionApi.delete(session.id);
              navigation.goBack();
            } catch (err: any) {
              Alert.alert(t('common.error'), err?.message ?? 'Failed');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Color.Cyan.v400} />
      </View>
    );
  }

  if (error || !session) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialIcons name="error-outline" size={48} color={Color.Gray.v300} />
        <Text style={styles.emptyText}>{error ?? t('common.error')}</Text>
      </View>
    );
  }

  const started = new Date(session.startedAt);
  const ended   = new Date(session.endedAt);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Metadata card */}
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{session.collectionType}</Text>
          <View style={styles.trialBadge}>
            <Text style={styles.trialBadgeText}>T{String(session.trialNumber).padStart(2, '0')}</Text>
          </View>
        </View>
        <Text style={styles.fileName}>{session.fileName}</Text>

        <View style={styles.metaGrid}>
          <Metric icon="event" label={t('deviceTests.metaDate')}
            value={`${started.toLocaleDateString()} ${started.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} />
          <Metric icon="schedule" label={t('deviceTests.metaDuration')} value={formatDuration(session.durationSeconds)} />
          <Metric icon="speed" label={t('deviceTests.metaRate')} value={`${session.sampleRateHz} Hz`} />
          <Metric icon="bar-chart" label={t('deviceTests.metaSamples')} value={String(session.sampleCount)} />
          <Metric icon="storage" label={t('deviceTests.metaSize')} value={formatBytes(session.fileSizeBytes)} />
          <Metric icon="event-available" label={t('deviceTests.metaEnded')}
            value={ended.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
        </View>
      </View>

      {/* Charts */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('deviceTests.chartAcceleration')}</Text>
        <ChartLegend items={[
          { color: '#E53935', label: 'X' },
          { color: '#43A047', label: 'Y' },
          { color: '#1E88E5', label: 'Z' },
        ]} />
        <TripleLineChart series={accSeries} unit="g" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('deviceTests.chartGyroscope')}</Text>
        <ChartLegend items={[
          { color: '#E53935', label: 'X' },
          { color: '#43A047', label: 'Y' },
          { color: '#1E88E5', label: 'Z' },
        ]} />
        <TripleLineChart series={gyrSeries} unit="°/s" />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, styles.downloadButton]} onPress={() => handleDownload('csv')} activeOpacity={0.8}>
          <MaterialIcons name="table-chart" size={20} color={Color.white} />
          <Text style={styles.actionText}>{t('deviceTests.downloadCsv')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.downloadButton]} onPress={() => handleDownload('raw')} activeOpacity={0.8}>
          <MaterialIcons name="memory" size={20} color={Color.white} />
          <Text style={styles.actionText}>{t('deviceTests.downloadBin')}</Text>
        </TouchableOpacity>
        {canDelete && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton, deleting && { opacity: 0.5 }]}
            onPress={handleDelete}
            disabled={deleting}
            activeOpacity={0.8}
          >
            <MaterialIcons name="delete-outline" size={20} color={Color.white} />
            <Text style={styles.actionText}>{t('common.delete')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

// ---------- helpers ----------
type AxisKey = 'ax' | 'ay' | 'az' | 'gx' | 'gy' | 'gz';

function buildSeries(samples: SamplesResponse | null, keys: [AxisKey, AxisKey, AxisKey]) {
  if (!samples || samples.samples.length === 0) return null;
  const colors = ['#E53935', '#43A047', '#1E88E5'];
  return keys.map((k, idx) => ({
    color: colors[idx],
    data: samples.samples.map(s => ({ value: s[k] as number })),
  }));
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

// ---------- subcomponents ----------
const Metric: React.FC<{ icon: any; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={styles.metricCell}>
    <MaterialIcons name={icon} size={16} color={Color.Gray.v400} />
    <View style={{ flex: 1 }}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1}>{value}</Text>
    </View>
  </View>
);

const ChartLegend: React.FC<{ items: Array<{ color: string; label: string }> }> = ({ items }) => (
  <View style={styles.legend}>
    {items.map(it => (
      <View key={it.label} style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: it.color }]} />
        <Text style={styles.legendText}>{it.label}</Text>
      </View>
    ))}
  </View>
);

const TripleLineChart: React.FC<{
  series: Array<{ color: string; data: Array<{ value: number }> }> | null;
  unit: string;
}> = ({ series, unit }) => {
  if (!series) {
    return <Text style={styles.emptyText}>—</Text>;
  }

  const all = series.flatMap(s => s.data.map(d => d.value));
  const min = Math.min(...all);
  const max = Math.max(...all);
  const margin = Math.max(0.2, (max - min) * 0.15);

  // gifted-charts requires data2/data3 on the FIRST data array (not separate prop set).
  return (
    <View>
      <LineChart
        data={series[0].data}
        data2={series[1].data}
        data3={series[2].data}
        color1={series[0].color}
        color2={series[1].color}
        color3={series[2].color}
        thickness1={1.5}
        thickness2={1.5}
        thickness3={1.5}
        height={CHART_HEIGHT}
        spacing={Math.max(2, Math.floor(280 / Math.max(series[0].data.length, 1)))}
        initialSpacing={4}
        endSpacing={4}
        hideDataPoints
        adjustToWidth
        maxValue={max + margin}
        mostNegativeValue={min - margin}
        noOfSections={4}
        rulesColor={Color.Gray.v100}
        yAxisColor={Color.Gray.v200}
        xAxisColor={Color.Gray.v200}
        yAxisTextStyle={{ color: Color.Gray.v400, fontSize: 10 }}
        hideRules={false}
        isAnimated={false}
      />
      <Text style={styles.chartUnit}>{unit}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Color.Background.subtle },
  content: { ...spacingStyles.screenScrollContainer, gap: Spacing.lg_24 },
  center: { justifyContent: 'center', alignItems: 'center', gap: Spacing.sm_12 },

  card: {
    backgroundColor: Color.Background.white,
    borderRadius: Border.md_12,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    padding: Spacing.md_16,
    gap: Spacing.sm_12,
  },
  cardTitle: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm_8,
  },
  title: {
    flex: 1,
    fontSize: FontSize.bodylarge_18,
    fontFamily: FontFamily.bold,
    color: Color.dark,
  },
  fileName: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v500,
  },
  trialBadge: {
    backgroundColor: Color.Cyan.v300 + '28',
    borderRadius: Border.sm_8,
    paddingHorizontal: Spacing.sm_8,
    paddingVertical: Spacing.xxs_2,
  },
  trialBadgeText: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.bold,
    color: Color.Cyan.v500,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm_8,
  },
  metricCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs_6,
    width: '47%',
    backgroundColor: Color.Background.subtle,
    borderRadius: Border.sm_8,
    padding: Spacing.sm_8,
  },
  metricLabel: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v400,
  },
  metricValue: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.sm_12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v500,
  },
  chartUnit: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v400,
  },
  emptyText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.sm_8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs_6,
    paddingVertical: Spacing.sm_12,
    borderRadius: Border.md_12,
  },
  downloadButton: { backgroundColor: Color.Cyan.v400 },
  deleteButton:   { backgroundColor: Color.Error.default },
  actionText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.white,
  },
});

export default DeviceSessionDetailsScreen;
