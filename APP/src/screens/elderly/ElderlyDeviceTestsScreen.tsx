import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { useAuthStore } from '@src/stores/authStore';
import { UserRole } from 'moveplus-shared';

// Local type — to be replaced when backend is ready
type DeviceSession = {
  id: number;
  startedAt: Date;
  endedAt: Date;
  durationSeconds: number;
  status: 'completed' | 'interrupted';
};

type Props = NativeStackScreenProps<any, 'ElderlyDeviceTests'>;

const ElderlyDeviceTestsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const role = user?.user?.role;

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const canAccess = [
    UserRole.INSTITUTION_ADMIN,
    UserRole.CAREGIVER,
    UserRole.CLINICIAN,
  ].includes(role as UserRole);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('deviceTests.title') });
  }, [navigation, t]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleStart = () => {
    if (isRunning) return;
    startTimeRef.current = new Date();
    setElapsedSeconds(0);
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  };

  const handleStop = () => {
    if (!isRunning || !startTimeRef.current) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const endedAt = new Date();
    const duration = Math.floor(
      (endedAt.getTime() - startTimeRef.current.getTime()) / 1000
    );
    const newSession: DeviceSession = {
      id: Date.now(),
      startedAt: startTimeRef.current,
      endedAt,
      durationSeconds: duration,
      status: 'completed',
    };
    setSessions(prev => [newSession, ...prev]);
    setIsRunning(false);
    setElapsedSeconds(0);
    startTimeRef.current = null;
  };

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  if (!canAccess) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <MaterialIcons name="lock" size={48} color={Color.Gray.v300} />
          <Text style={styles.emptyText}>{t('common.error')}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Session Control Card */}
      <View style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <View style={[styles.deviceIndicator, { backgroundColor: isRunning ? Color.Cyan.v300 : Color.Gray.v300 }]} />
          <Text style={styles.sessionTitle}>{t('deviceTests.sessionControl')}</Text>
          {isRunning && (
            <View style={styles.runningBadge}>
              <Text style={styles.runningBadgeText}>{t('deviceTests.sessionRunning')}</Text>
            </View>
          )}
        </View>

        {isRunning && (
          <View style={styles.timerContainer}>
            <MaterialIcons name="timer" size={20} color={Color.Cyan.v400} />
            <Text style={styles.timerText}>{formatDuration(elapsedSeconds)}</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton, isRunning && styles.buttonDisabled]}
            onPress={handleStart}
            disabled={isRunning}
            activeOpacity={0.8}
          >
            <MaterialIcons name="play-arrow" size={22} color={Color.white} />
            <Text style={styles.buttonText}>{t('deviceTests.start')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.stopButton, !isRunning && styles.buttonDisabled]}
            onPress={handleStop}
            disabled={!isRunning}
            activeOpacity={0.8}
          >
            <MaterialIcons name="stop" size={22} color={Color.white} />
            <Text style={styles.buttonText}>{t('deviceTests.stop')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sessions History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('deviceTests.history')}</Text>

        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="sensors-off" size={48} color={Color.Gray.v300} />
            <Text style={styles.emptyText}>{t('deviceTests.noSessions')}</Text>
          </View>
        ) : (
          <View style={styles.sessionsList}>
            {sessions.map(session => (
              <View key={session.id} style={styles.sessionRow}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: session.status === 'completed' ? Color.Cyan.v400 : Color.Warning.orange }
                ]} />
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionDate}>
                    {session.startedAt.toLocaleDateString()} · {session.startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.sessionDuration}>{formatDuration(session.durationSeconds)}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: session.status === 'completed' ? Color.Cyan.v300 + '28' : Color.Warning.orange + '28' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: session.status === 'completed' ? Color.Cyan.v500 : Color.Warning.orange }
                  ]}>
                    {t(`deviceTests.status_${session.status}` as any)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  content: {
    ...spacingStyles.screenScrollContainer,
    gap: Spacing.lg_24,
  },
  sessionCard: {
    backgroundColor: Color.Background.white,
    borderRadius: Border.md_12,
    padding: Spacing.md_16,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    shadowColor: Color.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    gap: Spacing.md_16,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm_8,
  },
  deviceIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sessionTitle: {
    flex: 1,
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
  },
  runningBadge: {
    backgroundColor: Color.Cyan.v300 + '28',
    borderRadius: Border.sm_8,
    paddingHorizontal: Spacing.sm_8,
    paddingVertical: Spacing.xxs_2,
  },
  runningBadgeText: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.semi_bold,
    color: Color.Cyan.v500,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs_4,
    backgroundColor: Color.Cyan.v300 + '15',
    borderRadius: Border.sm_8,
    paddingHorizontal: Spacing.sm_12,
    paddingVertical: Spacing.sm_8,
    alignSelf: 'flex-start',
  },
  timerText: {
    fontSize: FontSize.bodylarge_18,
    fontFamily: FontFamily.bold,
    color: Color.Cyan.v400,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm_12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs_6,
    paddingVertical: Spacing.sm_12,
    borderRadius: Border.md_12,
  },
  startButton: {
    backgroundColor: Color.Cyan.v400,
  },
  stopButton: {
    backgroundColor: Color.Error.default,
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  buttonText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.white,
  },
  section: {
    gap: Spacing.sm_12,
  },
  sectionTitle: {
    fontSize: FontSize.bodylarge_18,
    fontFamily: FontFamily.bold,
    color: Color.dark,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl_32,
    gap: Spacing.sm_8,
  },
  emptyText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
  sessionsList: {
    gap: Spacing.sm_8,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.Background.white,
    borderRadius: Border.md_12,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    padding: Spacing.md_16,
    gap: Spacing.sm_12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sessionInfo: {
    flex: 1,
    gap: Spacing.xxs_2,
  },
  sessionDate: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.medium,
    color: Color.dark,
  },
  sessionDuration: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
  },
  statusBadge: {
    borderRadius: Border.sm_8,
    paddingHorizontal: Spacing.sm_8,
    paddingVertical: Spacing.xxs_2,
  },
  statusText: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.semi_bold,
  },
});

export default ElderlyDeviceTestsScreen;
