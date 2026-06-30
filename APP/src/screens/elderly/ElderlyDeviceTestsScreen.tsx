import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { useAuthStore } from '@src/stores/authStore';
import { useElderlyDetailsStore } from '@src/stores/elderlyDetailsStore';
import { UserRole } from 'moveplus-shared';
import { beltService, BeltStatus, getBeltBaseUrl, setBeltBaseUrl, getBeltTransport } from '@src/services/deviceBelt';
import { deviceSessionApi } from '@src/api/endpoints/deviceSessions';
import { DeviceSession as ServerDeviceSession } from 'moveplus-shared';

type CollectionTypeOption = {
  key: string;
  code: string;
  labelKey: string;
};

const COLLECTION_TYPES: CollectionTypeOption[] = [
  { key: 'gait',       code: 'GAIT',  labelKey: 'deviceTests.type_gait' },
  { key: 'activities', code: 'MULTI', labelKey: 'deviceTests.type_activities' },
  { key: 'tug',        code: 'TUG',   labelKey: 'deviceTests.type_tug' },
  { key: 'poma',       code: 'POMA',  labelKey: 'deviceTests.type_poma' },
  { key: 'other',      code: 'OTHER', labelKey: 'deviceTests.type_other' },
];

type DeviceSession = {
  id: number;
  startedAt: Date;
  endedAt: Date;
  durationSeconds: number;
  status: 'completed' | 'interrupted';
  collectionTypeKey: string;
  collectionTypeLabel: string;
  collectionCode: string;
  trialNumber: number;
  fileName: string;
};

type UploadState =
  | { kind: 'idle' }
  | { kind: 'downloading' }
  | { kind: 'uploading' }
  | { kind: 'error'; message: string };

type Props = NativeStackScreenProps<any, 'ElderlyDeviceTests'>;

const sanitize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toUpperCase()
    .slice(0, 16) || 'CUSTOM';

const ElderlyDeviceTestsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const role = user?.user?.role;

  const { elderlyId } = (route.params ?? {}) as { elderlyId?: number };
  const { elderly, fetchElderly } = useElderlyDetailsStore();

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessions, setSessions] = useState<ServerDeviceSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({ kind: 'idle' });
  const [beltStatus, setBeltStatus] = useState<BeltStatus>(beltService.getStatus());

  const [selectedTypeKey, setSelectedTypeKey] = useState<string>(COLLECTION_TYPES[0].key);
  const [customTypeName, setCustomTypeName] = useState<string>('');
  const [trialNumberInput, setTrialNumberInput] = useState<string>('');
  const [typePickerVisible, setTypePickerVisible] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [beltUrlInput, setBeltUrlInput] = useState('');
  const [transport, setTransport] = useState<'mock' | 'wifi'>(getBeltTransport());

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const startedMetaRef = useRef<{
    collectionTypeKey: string;
    collectionTypeLabel: string;
    collectionCode: string;
    trialNumber: number;
    fileName: string;
  } | null>(null);

  const canAccess = [
    UserRole.INSTITUTION_ADMIN,
    UserRole.CAREGIVER,
    UserRole.CLINICIAN,
  ].includes(role as UserRole);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('deviceTests.title'),
      headerRight: () => (
        <TouchableOpacity
          onPress={async () => {
            const saved = await getBeltBaseUrl();
            setBeltUrlInput(saved ?? '');
            setSettingsVisible(true);
          }}
          style={{ paddingHorizontal: 8 }}
          accessibilityLabel={t('deviceTests.beltSettings')}
        >
          <MaterialIcons name="settings" size={22} color={Color.dark} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, t]);

  useEffect(() => {
    if (elderlyId && (!elderly || elderly.id !== elderlyId)) {
      fetchElderly(elderlyId);
    }
  }, [elderlyId, elderly, fetchElderly]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = beltService.onStatus(setBeltStatus);
    return unsubscribe;
  }, []);

  const refreshSessions = useCallback(async () => {
    if (!elderlyId) return;
    setSessionsLoading(true);
    try {
      const res = await deviceSessionApi.list(elderlyId);
      setSessions(res?.data ?? []);
    } catch (err) {
      // Non-fatal: history just stays empty until the user retries
    } finally {
      setSessionsLoading(false);
    }
  }, [elderlyId]);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  const isBeltConnected =
    beltStatus.state === 'connected' || beltStatus.state === 'streaming';
  const isBeltBusy =
    beltStatus.state === 'connecting' || beltStatus.state === 'streaming';

  const handleConnectBelt = async () => {
    setValidationError(null);
    try {
      await beltService.connect();
    } catch (err: any) {
      setValidationError(err?.message ?? t('deviceTests.errorBeltConnect'));
    }
  };

  const handleDisconnectBelt = async () => {
    if (isRunning) await handleStop();
    try {
      await beltService.disconnect();
    } catch (err: any) {
      setValidationError(err?.message ?? t('deviceTests.errorBeltConnect'));
    }
  };

  const selectedType = useMemo(
    () => COLLECTION_TYPES.find(o => o.key === selectedTypeKey) ?? COLLECTION_TYPES[0],
    [selectedTypeKey]
  );

  const isOther = selectedType.key === 'other';

  const resolvedCode = useMemo(() => {
    if (isOther) return sanitize(customTypeName);
    return selectedType.code;
  }, [isOther, customTypeName, selectedType]);

  const resolvedTypeLabel = useMemo(() => {
    if (isOther && customTypeName.trim().length > 0) return customTypeName.trim();
    return t(selectedType.labelKey as any);
  }, [isOther, customTypeName, selectedType, t]);

  const suggestedTrialNumber = useMemo(() => {
    const matching = sessions.filter(s =>
      (selectedTypeKey !== 'other' && s.collectionCode === selectedType.code) ||
      (selectedTypeKey === 'other' && s.collectionCode === resolvedCode)
    );
    return matching.length + 1;
  }, [sessions, selectedTypeKey, selectedType, resolvedCode]);

  useEffect(() => {
    setTrialNumberInput(String(suggestedTrialNumber));
  }, [suggestedTrialNumber]);

  const institutionId = elderly?.institution?.id;
  const subjectId = elderly?.id;
  const institutionTag = useMemo(() => {
    const inst = elderly?.institution;
    const raw = (inst?.nickname && inst.nickname.trim().length > 0)
      ? inst.nickname
      : (inst?.name ?? '');
    return raw.trim().length === 0 ? '' : sanitize(raw);
  }, [elderly]);
  const subjectTag = useMemo(() => {
    const raw = elderly?.name ?? '';
    return raw.trim().length === 0 ? '' : sanitize(raw);
  }, [elderly]);

  const parsedTrial = useMemo(() => {
    const n = parseInt(trialNumberInput, 10);
    return Number.isFinite(n) && n > 0 ? n : suggestedTrialNumber;
  }, [trialNumberInput, suggestedTrialNumber]);

  const previewFileName = useMemo(() => {
    if (!institutionTag || !subjectTag) return '';
    const trialPart = `T${String(parsedTrial).padStart(2, '0')}`;
    return `${institutionTag}_${subjectTag}_${trialPart}`;
  }, [institutionTag, subjectTag, parsedTrial]);

  const handleStart = async () => {
    if (isRunning) return;

    if (isOther && customTypeName.trim().length === 0) {
      setValidationError(t('deviceTests.errorCustomTypeRequired'));
      return;
    }
    if (!institutionId || !subjectId) {
      setValidationError(t('deviceTests.errorElderlyMissing'));
      return;
    }
    if (!isBeltConnected) {
      setValidationError(t('deviceTests.errorBeltNotConnected'));
      return;
    }

    setValidationError(null);
    startedMetaRef.current = {
      collectionTypeKey: selectedTypeKey,
      collectionTypeLabel: resolvedTypeLabel,
      collectionCode: resolvedCode,
      trialNumber: parsedTrial,
      fileName: previewFileName,
    };

    try {
      await beltService.sendFileName(previewFileName);
      await beltService.startStream();
    } catch (err: any) {
      setValidationError(err?.message ?? t('deviceTests.errorBeltConnect'));
      startedMetaRef.current = null;
      return;
    }

    startTimeRef.current = new Date();
    setElapsedSeconds(0);
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  };

  const handleStop = async () => {
    if (!isRunning || !startTimeRef.current || !startedMetaRef.current) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    try {
      await beltService.stopStream();
    } catch {
      // best-effort stop; still try to upload anything captured
    }
    const endedAt = new Date();
    const startedAt = startTimeRef.current;
    const durationSeconds = Math.max(
      0,
      (endedAt.getTime() - startedAt.getTime()) / 1000,
    );
    const meta = startedMetaRef.current;

    setIsRunning(false);
    setElapsedSeconds(0);
    startTimeRef.current = null;
    startedMetaRef.current = null;

    if (!elderlyId) return;

    // Download from belt, then upload to server.
    try {
      setUploadState({ kind: 'downloading' });
      const payload = await beltService.downloadFile(meta.fileName);
      if (!payload || payload.byteLength === 0) {
        setUploadState({ kind: 'error', message: t('deviceTests.errorEmptyPayload') });
        return;
      }
      setUploadState({ kind: 'uploading' });
      await deviceSessionApi.upload(elderlyId, payload, {
        fileName: meta.fileName,
        collectionType: meta.collectionTypeLabel,
        collectionCode: meta.collectionCode,
        trialNumber: meta.trialNumber,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationSeconds,
      });
      setUploadState({ kind: 'idle' });
      await refreshSessions();
    } catch (err: any) {
      setUploadState({
        kind: 'error',
        message: err?.message ?? t('deviceTests.errorUploadFailed'),
      });
    }
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

      {/* Collection Configuration Card */}
      <View style={styles.configCard}>
        <Text style={styles.configCardTitle}>{t('deviceTests.collectionConfig')}</Text>

        {/* Collection Type */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t('deviceTests.collectionType')}</Text>
          <TouchableOpacity
            style={[styles.dropdown, isRunning && styles.fieldDisabled]}
            onPress={() => !isRunning && setTypePickerVisible(true)}
            activeOpacity={0.7}
            disabled={isRunning}
          >
            <Text style={styles.dropdownText}>{t(selectedType.labelKey as any)}</Text>
            <MaterialIcons name="arrow-drop-down" size={22} color={Color.Gray.v400} />
          </TouchableOpacity>
        </View>

        {/* Custom Type (when Other) */}
        {isOther && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('deviceTests.customTypeLabel')}</Text>
            <TextInput
              style={[styles.input, isRunning && styles.fieldDisabled]}
              value={customTypeName}
              onChangeText={setCustomTypeName}
              placeholder={t('deviceTests.customTypePlaceholder')}
              placeholderTextColor={Color.Gray.v400}
              editable={!isRunning}
              maxLength={32}
            />
          </View>
        )}

        {/* Trial Number */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t('deviceTests.trialNumber')}</Text>
          <View style={styles.trialRow}>
            <TextInput
              style={[styles.input, styles.trialInput, isRunning && styles.fieldDisabled]}
              value={trialNumberInput}
              onChangeText={(v) => setTrialNumberInput(v.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="number-pad"
              editable={!isRunning}
            />
            <Text style={styles.trialHint}>
              {t('deviceTests.trialSuggested', { n: suggestedTrialNumber })}
            </Text>
          </View>
        </View>

        {/* Filename Preview */}
        {previewFileName ? (
          <View style={styles.filenamePreview}>
            <MaterialIcons name="insert-drive-file" size={18} color={Color.Cyan.v500} />
            <View style={{ flex: 1 }}>
              <Text style={styles.filenamePreviewLabel}>{t('deviceTests.fileNamePreview')}</Text>
              <Text style={styles.filenamePreviewValue} numberOfLines={2}>{previewFileName}</Text>
            </View>
          </View>
        ) : null}

        {validationError ? (
          <Text style={styles.errorText}>{validationError}</Text>
        ) : null}
      </View>

      {/* Session Control Card */}
      <View style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <View style={[
            styles.deviceIndicator,
            {
              backgroundColor: beltStatus.state === 'streaming'
                ? Color.Cyan.v400
                : beltStatus.state === 'connected'
                  ? Color.Cyan.v300
                  : beltStatus.state === 'connecting'
                    ? Color.Warning.orange
                    : Color.Gray.v300,
            },
          ]} />
          <Text style={styles.sessionTitle}>{t('deviceTests.sessionControl')}</Text>
          <View style={[styles.transportBadge, transport === 'wifi' ? styles.transportBadgeWifi : styles.transportBadgeMock]}>
            <MaterialIcons
              name={transport === 'wifi' ? 'wifi' : 'science'}
              size={12}
              color={transport === 'wifi' ? Color.Cyan.v500 : Color.Warning.orange}
            />
            <Text style={[styles.transportBadgeText, { color: transport === 'wifi' ? Color.Cyan.v500 : Color.Warning.orange }]}>
              {t(transport === 'wifi' ? 'deviceTests.transportWifi' : 'deviceTests.transportMock')}
            </Text>
          </View>
          {isRunning && (
            <View style={styles.runningBadge}>
              <Text style={styles.runningBadgeText}>{t('deviceTests.sessionRunning')}</Text>
            </View>
          )}
        </View>

        {/* Belt connection row */}
        <View style={styles.beltRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.beltStateLabel}>
              {t(`deviceTests.beltState_${beltStatus.state}` as any)}
            </Text>
            {beltStatus.message ? (
              <Text style={styles.beltMessage} numberOfLines={2}>{beltStatus.message}</Text>
            ) : null}
          </View>
          {!isBeltConnected ? (
            <TouchableOpacity
              style={[styles.beltButton, styles.beltConnectButton, isBeltBusy && styles.buttonDisabled]}
              onPress={handleConnectBelt}
              disabled={isBeltBusy}
              activeOpacity={0.8}
            >
              <MaterialIcons name="bluetooth-searching" size={18} color={Color.white} />
              <Text style={styles.beltButtonText}>{t('deviceTests.connectBelt')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.beltButton, styles.beltDisconnectButton]}
              onPress={handleDisconnectBelt}
              activeOpacity={0.8}
            >
              <MaterialIcons name="bluetooth-disabled" size={18} color={Color.dark} />
              <Text style={[styles.beltButtonText, { color: Color.dark }]}>{t('deviceTests.disconnectBelt')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {isRunning && (
          <View style={styles.timerContainer}>
            <MaterialIcons name="timer" size={20} color={Color.Cyan.v400} />
            <Text style={styles.timerText}>{formatDuration(elapsedSeconds)}</Text>
            <Text style={styles.samplesText}>
              {t('deviceTests.samplesReceived', { n: beltStatus.samplesReceived })}
            </Text>
          </View>
        )}

        {(uploadState.kind === 'downloading' || uploadState.kind === 'uploading') && (
          <View style={styles.uploadRow}>
            <MaterialIcons name="cloud-upload" size={18} color={Color.Cyan.v500} />
            <Text style={styles.uploadText}>
              {t(uploadState.kind === 'downloading' ? 'deviceTests.downloadingFromBelt' : 'deviceTests.uploadingToServer')}
            </Text>
          </View>
        )}
        {uploadState.kind === 'error' && (
          <View style={styles.uploadRow}>
            <MaterialIcons name="error-outline" size={18} color={Color.Error.default} />
            <Text style={[styles.uploadText, { color: Color.Error.default, flex: 1 }]} numberOfLines={2}>
              {uploadState.message}
            </Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton, (isRunning || !isBeltConnected) && styles.buttonDisabled]}
            onPress={handleStart}
            disabled={isRunning || !isBeltConnected}
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('deviceTests.history')}</Text>
          <TouchableOpacity onPress={refreshSessions} disabled={sessionsLoading} style={{ padding: 4 }}>
            <MaterialIcons name="refresh" size={22} color={sessionsLoading ? Color.Gray.v300 : Color.Cyan.v500} />
          </TouchableOpacity>
        </View>

        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="sensors-off" size={48} color={Color.Gray.v300} />
            <Text style={styles.emptyText}>{t('deviceTests.noSessions')}</Text>
          </View>
        ) : (
          <View style={styles.sessionsList}>
            {sessions.map(session => {
              const started = new Date(session.startedAt);
              return (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionRow}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('DeviceSessionDetails', { sessionId: session.id })}
                >
                  <View style={[styles.statusDot, { backgroundColor: Color.Cyan.v400 }]} />
                  <View style={styles.sessionInfo}>
                    <View style={styles.sessionTitleRow}>
                      <Text style={styles.sessionTypeLabel}>{session.collectionType}</Text>
                      <View style={styles.trialBadge}>
                        <Text style={styles.trialBadgeText}>T{String(session.trialNumber).padStart(2, '0')}</Text>
                      </View>
                    </View>
                    <Text style={styles.sessionFileName} numberOfLines={1}>{session.fileName}</Text>
                    <Text style={styles.sessionDate}>
                      {started.toLocaleDateString()} · {started.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {formatDuration(Math.round(session.durationSeconds))} · {session.sampleCount} {t('deviceTests.samples')}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={Color.Gray.v300} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Collection Type Picker Modal */}
      <Modal
        visible={typePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTypePickerVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setTypePickerVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('deviceTests.selectCollectionType')}</Text>
            {COLLECTION_TYPES.map(option => {
              const selected = option.key === selectedTypeKey;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.modalOption, selected && styles.modalOptionSelected]}
                  onPress={() => {
                    setSelectedTypeKey(option.key);
                    setTypePickerVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>
                    {t(option.labelKey as any)}
                  </Text>
                  {selected && <MaterialIcons name="check" size={20} color={Color.Cyan.v500} />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Belt connection settings modal */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSettingsVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('deviceTests.beltSettings')}</Text>
            <Text style={styles.beltSettingsHint}>{t('deviceTests.beltSettingsHint')}</Text>
            <TextInput
              style={styles.input}
              value={beltUrlInput}
              onChangeText={setBeltUrlInput}
              placeholder="http://192.168.1.50"
              placeholderTextColor={Color.Gray.v400}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <View style={[styles.buttonRow, { marginTop: Spacing.sm_12 }]}>
              <TouchableOpacity
                style={[styles.actionButton, styles.stopButton]}
                onPress={async () => {
                  await setBeltBaseUrl(null);
                  setTransport(getBeltTransport());
                  setBeltStatus(beltService.getStatus());
                  setSettingsVisible(false);
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons name="science" size={18} color={Color.white} />
                <Text style={styles.buttonText}>{t('deviceTests.useMock')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.startButton]}
                onPress={async () => {
                  await setBeltBaseUrl(beltUrlInput.trim());
                  setTransport(getBeltTransport());
                  setBeltStatus(beltService.getStatus());
                  setSettingsVisible(false);
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons name="wifi" size={18} color={Color.white} />
                <Text style={styles.buttonText}>{t('deviceTests.useWifi')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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

  // Config card
  configCard: {
    backgroundColor: Color.Background.white,
    borderRadius: Border.md_12,
    padding: Spacing.md_16,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    gap: Spacing.sm_12,
  },
  configCardTitle: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
    marginBottom: Spacing.xs_4,
  },
  field: {
    gap: Spacing.xs_6,
  },
  fieldLabel: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v500,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    borderRadius: Border.sm_8,
    paddingHorizontal: Spacing.sm_12,
    paddingVertical: Spacing.sm_10,
    backgroundColor: Color.Background.white,
  },
  dropdownText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.dark,
  },
  input: {
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    borderRadius: Border.sm_8,
    paddingHorizontal: Spacing.sm_12,
    paddingVertical: Spacing.sm_10,
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.dark,
    backgroundColor: Color.Background.white,
  },
  trialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm_12,
  },
  trialInput: {
    width: 80,
    textAlign: 'center',
  },
  trialHint: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
    flex: 1,
  },
  fieldDisabled: {
    opacity: 0.5,
  },
  filenamePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm_8,
    backgroundColor: Color.Cyan.v100,
    borderRadius: Border.sm_8,
    padding: Spacing.sm_12,
  },
  filenamePreviewLabel: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.medium,
    color: Color.Cyan.v500,
  },
  filenamePreviewValue: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
    marginTop: 2,
  },
  errorText: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.medium,
    color: Color.Error.default,
  },

  // Session card
  sessionCard: {
    backgroundColor: Color.Background.white,
    borderRadius: Border.md_12,
    padding: Spacing.md_16,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
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
  transportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Border.sm_8,
    paddingHorizontal: Spacing.sm_8,
    paddingVertical: Spacing.xxs_2,
  },
  transportBadgeWifi: {
    backgroundColor: Color.Cyan.v300 + '20',
  },
  transportBadgeMock: {
    backgroundColor: Color.Warning.orange + '20',
  },
  transportBadgeText: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.semi_bold,
  },
  beltSettingsHint: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v500,
    marginBottom: Spacing.sm_8,
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm_8,
    backgroundColor: Color.Background.subtle,
    borderRadius: Border.sm_8,
    paddingHorizontal: Spacing.sm_12,
    paddingVertical: Spacing.sm_8,
  },
  uploadText: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.medium,
    color: Color.Cyan.v500,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  samplesText: {
    marginLeft: 'auto',
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.medium,
    color: Color.Cyan.v500,
  },
  beltRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm_12,
    backgroundColor: Color.Background.subtle,
    borderRadius: Border.sm_8,
    padding: Spacing.sm_12,
  },
  beltStateLabel: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
  },
  beltMessage: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v500,
    marginTop: 2,
  },
  beltButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs_4,
    paddingHorizontal: Spacing.sm_12,
    paddingVertical: Spacing.sm_8,
    borderRadius: Border.sm_8,
  },
  beltConnectButton: {
    backgroundColor: Color.Cyan.v400,
  },
  beltDisconnectButton: {
    backgroundColor: Color.Gray.v200,
  },
  beltButtonText: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.semi_bold,
    color: Color.white,
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

  // History
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
    alignItems: 'flex-start',
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
    marginTop: 6,
  },
  sessionInfo: {
    flex: 1,
    gap: Spacing.xxs_2,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm_8,
  },
  sessionTypeLabel: {
    flex: 1,
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
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
  sessionFileName: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v500,
  },
  sessionDate: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg_24,
  },
  modalSheet: {
    backgroundColor: Color.Background.white,
    borderRadius: Border.md_12,
    padding: Spacing.md_16,
    gap: Spacing.sm_8,
  },
  modalTitle: {
    fontSize: FontSize.bodylarge_18,
    fontFamily: FontFamily.bold,
    color: Color.dark,
    marginBottom: Spacing.sm_8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm_12,
    paddingHorizontal: Spacing.sm_12,
    borderRadius: Border.sm_8,
  },
  modalOptionSelected: {
    backgroundColor: Color.Cyan.v100,
  },
  modalOptionText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.dark,
  },
  modalOptionTextSelected: {
    fontFamily: FontFamily.semi_bold,
    color: Color.Cyan.v500,
  },
});

export default ElderlyDeviceTestsScreen;
