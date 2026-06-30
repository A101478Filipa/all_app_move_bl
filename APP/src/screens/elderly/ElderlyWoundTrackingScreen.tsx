import React, { useCallback, useEffect, useState } from 'react';
import {
  View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator,
  Alert, TextInput, Modal, KeyboardAvoidingView, Platform, Switch, Image, RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '@src/stores/authStore';
import { UserRole } from 'moveplus-shared';
import { Color } from '@src/styles/colors';
import { spacingStyles, Spacing } from '@src/styles/spacings';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { MaterialIcons } from '@expo/vector-icons';
import { shadowStyles } from '@src/styles/shadow';
import { Border } from '@src/styles/borders';
import { woundTrackingApi, WoundCase, WoundTracking } from '@src/api/endpoints/woundTracking';
import { buildAvatarUrl } from '@src/services/ApiService';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import BodyLocationPicker from '@src/components/BodyLocationPicker';
import { useFocusEffect } from '@react-navigation/native';
import { externalAccessApi, ExternalElderlyWound } from '@src/api/endpoints/externalAccess';
import { asyncStorageService } from '@src/services/AsyncStorageService';

type Props = NativeStackScreenProps<any, 'ElderlyWoundTrackingScreen'>;
type FilterTab = 'all' | 'ongoing' | 'resolved';
type UnifiedItem =
  | { kind: 'case'; item: WoundCase; sortDate: string }
  | { kind: 'tracking'; item: WoundTracking; sortDate: string };

const ElderlyWoundTrackingScreen: React.FC<Props> = ({ route, navigation }) => {
  const { elderlyId, isExternalToken, initialData } = (route.params ?? {}) as any;
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const role = user?.user?.role;

  const isPrivileged = [
    UserRole.INSTITUTION_ADMIN,
    UserRole.CAREGIVER,
    UserRole.CLINICIAN,
    UserRole.PROGRAMMER,
  ].includes(role as UserRole);

  const [cases, setCases] = useState<WoundCase[]>([]);
  const [trackings, setTrackings] = useState<WoundTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  // Add-tracking modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [isNewWound, setIsNewWound] = useState(false);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  // new-wound fields (same as fall/SOS injury section)
  const [injuryDescription, setInjuryDescription] = useState('');
  // update fields
  const [notes, setNotes] = useState('');
  const [isResolved, setIsResolved] = useState(false);
  const [selectedBodyLocations, setSelectedBodyLocations] = useState<string[]>([]);
  const [pickedPhoto, setPickedPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  // ─── External token state ─────────────────────────────────────────────────────
  const [externalWounds, setExternalWounds] = useState<WoundTracking[]>([]);
  const [externalLoading, setExternalLoading] = useState(isExternalToken ? true : false);

  const loadExternalWounds = useCallback(async () => {
    const token = await asyncStorageService.getExternalToken();
    if (!token) return;
    setExternalLoading(true);
    try {
      const res = await externalAccessApi.getProfileByToken(token);
      const wounds = (res.data.elderly.recentWounds || []) as unknown as WoundTracking[];
      setExternalWounds(wounds.filter(w => !w.isResolved));
    } catch (error) {
      console.error('Erro ao carregar feridas externas:', error);
    } finally {
      setExternalLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (isExternalToken) {
      loadExternalWounds();
    }
  }, [isExternalToken, loadExternalWounds]));

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [casesRes, trackingsRes] = await Promise.all([
        woundTrackingApi.getElderlyWoundCases(elderlyId).catch(() => ({ data: [] })),
        woundTrackingApi.getElderlyWoundTrackings(elderlyId).catch(() => ({ data: [] })),
      ]);
      setCases(Array.isArray(casesRes.data) ? casesRes.data : []);
      setTrackings(Array.isArray(trackingsRes.data) ? trackingsRes.data : []);
    } finally {
      setLoading(false);
    }
  }, [elderlyId]);

  useEffect(() => { if (!isExternalToken) { fetchAll(); } }, [fetchAll, isExternalToken]);

  // Combine + sort newest first
  const allItems: UnifiedItem[] = [
    ...cases.map(c => ({ kind: 'case' as const, item: c, sortDate: c.occurrenceDate })),
    ...trackings.map(tr => ({ kind: 'tracking' as const, item: tr, sortDate: tr.createdAt })),
  ].sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

  const filteredItems = allItems.filter(({ item }) => {
    if (activeFilter === 'ongoing') return !item.isResolved;
    if (activeFilter === 'resolved') return item.isResolved;
    return true;
  });

  const parseDate = (val: any): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
    // try replacing space with T for MySQL-style strings
    const d2 = new Date(String(val).replace(' ', 'T'));
    return isNaN(d2.getTime()) ? null : d2;
  };

  const formatDate = (dateStr: any) => {
    const d = parseDate(dateStr);
    if (!d) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  };

  const formatDateTime = (dateStr: any) => {
    const d = parseDate(dateStr);
    if (!d) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()} ${hour}:${min}`;
  };

  // ─── Add tracking modal ──────────────────────────────────────────────────────

  const openModal = (isNew: boolean, parentId?: number) => {
    setIsNewWound(isNew);
    setCurrentParentId(parentId ?? null);
    setInjuryDescription('');
    setNotes('');
    setIsResolved(false);
    setPickedPhoto(null);
    setSelectedBodyLocations([]);
    setModalVisible(true);
  };

  // Auto-open from navigation param (new wound)
  useEffect(() => {
    if ((route.params as any)?.openModal) {
      openModal(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickPhoto = (fromCamera: boolean) => {
    const run = async () => {
      let result: ImagePicker.ImagePickerResult;
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return;
        result = await ImagePicker.launchCameraAsync({ mediaTypes: 'Images' as any, quality: 0.7 });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'Images' as any, quality: 0.7 });
      }
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const name = asset.uri.split('/').pop() || 'photo.jpg';
        const ext = /\.(\w+)$/.exec(name);
        setPickedPhoto({ uri: asset.uri, name, type: ext ? `image/${ext[1]}` : 'image/jpeg' });
      }
    };
    run();
  };

  const showPhotoPicker = () => Alert.alert(t('woundTracking.photo'), undefined, [
    { text: t('fallOccurrence.takePhoto'), onPress: () => pickPhoto(true) },
    { text: t('fallOccurrence.chooseFromGallery'), onPress: () => pickPhoto(false) },
    ...(pickedPhoto ? [{ text: t('woundTracking.removePhoto'), style: 'destructive' as const, onPress: () => setPickedPhoto(null) }] : []),
    { text: t('common.cancel'), style: 'cancel' },
  ]);

  const handleSubmit = async () => {
    if (isNewWound) {
      if (selectedBodyLocations.length === 0) { Alert.alert(t('woundTracking.bodyLocationRequired')); return; }
      if (!injuryDescription.trim()) { Alert.alert(t('fallOccurrence.fillRequiredFields')); return; }
    } else {
      if (!notes.trim() && !pickedPhoto && !isResolved) { Alert.alert(t('woundTracking.errorEmpty')); return; }
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (isNewWound) {
        formData.append('notes', injuryDescription.trim());
        formData.append('bodyLocations', JSON.stringify(selectedBodyLocations));
      } else {
        if (notes.trim()) formData.append('notes', notes.trim());
        formData.append('isResolved', String(isResolved));
        if (currentParentId) formData.append('parentTrackingId', String(currentParentId));
      }
      if (pickedPhoto) formData.append('photo', { uri: pickedPhoto.uri, name: pickedPhoto.name, type: pickedPhoto.type } as any);

      if (isExternalToken) {
        const token = await asyncStorageService.getExternalToken();
        if (!token) { Alert.alert(t('woundTracking.uploadFailed')); return; }
        const res = await externalAccessApi.addExternalWoundTracking(token, formData);
        if (res.data) {
          if (currentParentId) {
            // Add update to parent's updates array
            setExternalWounds(prev => prev.map(w =>
              w.id === currentParentId
                ? { ...w, updates: [...(w.updates || []), res.data as WoundTracking] }
                : w
            ));
          } else {
            setExternalWounds(prev => [{ ...(res.data as WoundTracking), updates: [] }, ...prev]);
          }
          setModalVisible(false);
        }
      } else {
        const res = await woundTrackingApi.addElderlyWoundTracking(elderlyId, formData);
        if (res.data) {
          if (currentParentId) {
            setTrackings(prev => prev.map(t =>
              t.id === currentParentId
                ? { ...t, updates: [...(t.updates || []), res.data] }
                : t
            ));
          } else {
            setTrackings(prev => [{ ...res.data, updates: [] }, ...prev]);
          }
          setModalVisible(false);
        }
      }
    } catch { Alert.alert(t('woundTracking.uploadFailed')); }
    finally { setSubmitting(false); }
  };

  const confirmDelete = (trackingId: number) => {
    Alert.alert(t('woundTracking.deleteTitle'), t('woundTracking.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        try { await woundTrackingApi.deleteWoundTracking(trackingId); setTrackings(prev => prev.filter(tr => tr.id !== trackingId)); }
        catch { /* ignore */ }
      }},
    ]);
  };

  const handleResolveWound = (trackingId: number) => {
    Alert.alert(
      t('woundTracking.resolved'),
      t('woundTracking.markResolvedDescription'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('woundTracking.markResolved'),
          style: 'destructive',
          onPress: async () => {
            try {
              if (isExternalToken) {
                const token = await asyncStorageService.getExternalToken();
                if (!token) return;
                await externalAccessApi.resolveExternalWound(token, trackingId);
                setExternalWounds(prev => prev.filter(w => w.id !== trackingId));
              } else {
                await woundTrackingApi.resolveWoundTracking(trackingId);
                setTrackings(prev => prev.map(t =>
                  t.id === trackingId ? { ...t, isResolved: true } : t
                ));
              }
            } catch {
              Alert.alert(t('common.error'));
            }
          },
        },
      ]
    );
  };

  // ─── Render helpers ──────────────────────────────────────────────────────────

  const StatusBadge = ({ resolved }: { resolved: boolean }) => (
    <View style={[styles.statusBadge, resolved ? styles.statusResolved : styles.statusOngoing]}>
      <Text style={[styles.statusText, resolved ? styles.statusResolvedText : styles.statusOngoingText]}>
        {resolved ? t('woundTracking.resolved') : t('woundTracking.ongoing')}
      </Text>
    </View>
  );

  const renderExternalWoundCard = (wound: ExternalElderlyWound, idx: number) => (
    <View key={`ext-wound-${idx}`} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.typeRow}>
            <MaterialIcons name="healing" size={14} color={Color.Gray.v500} />
            <Text style={styles.typeLabel}>{wound.location}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(wound.lastUpdate)}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <View style={[styles.statusBadge, styles.statusOngoing]}>
            <Text style={[styles.statusText, styles.statusOngoingText]}>{t('woundTracking.ongoing')}</Text>
          </View>
        </View>
      </View>
      {wound.status ? (
        <Text style={styles.descriptionText}>{wound.status}</Text>
      ) : null}
    </View>
  );

  const renderCaseItem = (woundCase: WoundCase, idx: number) => (
    <TouchableOpacity
      key={`case-${idx}`}
      style={styles.card}
      onPress={() => woundCase.occurrenceType === 'fall'
        ? navigation.push('FallOccurrenceScreen', { occurrenceId: woundCase.occurrenceId })
        : navigation.push('SosOccurrenceScreen', { occurrenceId: woundCase.occurrenceId })}
      activeOpacity={0.75}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.typeRow}>
            <MaterialIcons
              name={woundCase.occurrenceType === 'fall' ? 'accessibility-new' : 'sos'}
              size={14} color={Color.Gray.v500}
            />
            <Text style={styles.typeLabel}>
              {woundCase.occurrenceType === 'fall' ? t('fallOccurrence.title') : t('sosOccurrence.title')}
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(woundCase.occurrenceDate)}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <StatusBadge resolved={woundCase.isResolved} />
          <MaterialIcons name="chevron-right" size={20} color={Color.Gray.v400} />
        </View>
      </View>
      {woundCase.injuryDescription ? (
        <Text style={styles.descriptionText} numberOfLines={2}>{woundCase.injuryDescription}</Text>
      ) : null}
      {isPrivileged && (
        <TouchableOpacity
          style={styles.addUpdateBtn}
          onPress={() => woundCase.occurrenceType === 'fall'
            ? navigation.push('FallOccurrenceScreen', { occurrenceId: woundCase.occurrenceId })
            : navigation.push('SosOccurrenceScreen', { occurrenceId: woundCase.occurrenceId })}
        >
          <MaterialIcons name="add" size={15} color={Color.primary} />
          <Text style={styles.addUpdateBtnText}>{t('woundTracking.addUpdate')}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderUpdateItem = (update: WoundTracking, idx: number) => (
    <View key={`update-${update.id}-${idx}`} style={styles.updateItem}>
      <View style={styles.updateDot} />
      <View style={styles.updateContent}>
        <Text style={styles.updateDate}>{formatDateTime(update.createdAt)}</Text>
        {update.notes ? <Text style={styles.notesText}>{update.notes}</Text> : null}
        {update.isResolved ? (
          <View style={[styles.statusBadge, styles.statusResolved, { alignSelf: 'flex-start', marginTop: 4 }]}>
            <Text style={[styles.statusText, styles.statusResolvedText]}>{t('woundTracking.resolved')}</Text>
          </View>
        ) : null}
        {update.photoUrl ? (
          <TouchableOpacity onPress={() => setFullscreenPhoto(buildAvatarUrl(update.photoUrl!))}>
            <Image source={{ uri: buildAvatarUrl(update.photoUrl) }} style={[styles.photo, { height: 120, marginTop: 6 }]} resizeMode="cover" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  const renderTrackingItem = (tracking: WoundTracking, idx: number) => (
    <View key={`tracking-${tracking.id}-${idx}`} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.typeRow}>
            <MaterialIcons name="healing" size={14} color={Color.Gray.v500} />
            <Text style={styles.typeLabel}>{t('woundTracking.manualEntry')}</Text>
          </View>
          <Text style={styles.dateText}>{formatDateTime(tracking.createdAt)}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <StatusBadge resolved={tracking.isResolved} />
          {isPrivileged && !isExternalToken && (
            <TouchableOpacity onPress={() => confirmDelete(tracking.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="delete-outline" size={18} color={Color.Error.default} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {tracking.notes ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesLabel}>{t('woundTracking.notes')}</Text>
          <Text style={styles.notesText}>{tracking.notes}</Text>
        </View>
      ) : null}
      {(!tracking.notes && tracking.bodyLocations && tracking.bodyLocations.length > 0) ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesLabel}>{t('woundTracking.bodyLocation')}</Text>
          <Text style={styles.notesText}>{tracking.bodyLocations.join(', ')}</Text>
        </View>
      ) : null}
      {tracking.photoUrl ? (
        <TouchableOpacity onPress={() => setFullscreenPhoto(buildAvatarUrl(tracking.photoUrl!))}>
          <Image source={{ uri: buildAvatarUrl(tracking.photoUrl) }} style={styles.photo} resizeMode="cover" />
          <Text style={styles.tapToExpand}>{t('woundTracking.tapToExpand')}</Text>
        </TouchableOpacity>
      ) : null}

      {/* Updates timeline */}
      {(tracking.updates && tracking.updates.length > 0) ? (
        <View style={styles.updatesSection}>
          <Text style={styles.updatesSectionLabel}>{t('woundTracking.updates')} ({tracking.updates.length})</Text>
          {tracking.updates.map((update, i) => renderUpdateItem(update, i))}
        </View>
      ) : null}

      {/* Actions */}
      {!tracking.isResolved && (
        <View style={styles.actionRow}>
          {(isPrivileged || isExternalToken) && (
            <TouchableOpacity style={styles.addUpdateBtn} onPress={() => openModal(false, tracking.id)}>
              <MaterialIcons name="add" size={15} color={Color.primary} />
              <Text style={styles.addUpdateBtnText}>{t('woundTracking.addUpdate')}</Text>
            </TouchableOpacity>
          )}
          {(isPrivileged || isExternalToken) && (
            <TouchableOpacity style={styles.resolveBtn} onPress={() => handleResolveWound(tracking.id)}>
              <MaterialIcons name="check-circle-outline" size={15} color={Color.primary} />
              <Text style={styles.resolveBtnText}>{t('woundTracking.markResolved')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          isExternalToken
            ? <RefreshControl refreshing={externalLoading} onRefresh={loadExternalWounds} />
            : undefined
        }
      >

        {/* Header row: title only */}
        <View style={styles.headerLeft}>
          <MaterialIcons name="healing" size={20} color={Color.primary} />
          <Text style={styles.screenTitle}>{t('woundTracking.title')}</Text>
        </View>

        {isExternalToken ? (
          // ─── External view (ongoing wounds, same design as admin) ────────────────
          externalLoading ? (
            <ActivityIndicator size="small" color={Color.primary} style={{ marginVertical: Spacing.md_16 }} />
          ) : externalWounds.length === 0 ? (
            <Text style={styles.emptyText}>{t('woundTracking.noUpdates')}</Text>
          ) : (
            <View style={styles.list}>
              {externalWounds.map((wound, idx) => renderTrackingItem(wound, idx))}
            </View>
          )
        ) : (
          // ─── Normal view ────────────────────────────────────────────────────
          <>
            {/* Unified filter tabs */}
            {!loading && allItems.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {(['all', 'ongoing', 'resolved'] as FilterTab[]).map(tab => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
                    onPress={() => setActiveFilter(tab)}
                  >
                    <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>
                      {t(`woundTracking.filter_${tab}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Unified list */}
            {loading ? (
              <ActivityIndicator size="small" color={Color.primary} style={{ marginVertical: Spacing.md_16 }} />
            ) : filteredItems.length === 0 ? (
              <Text style={styles.emptyText}>{t('woundTracking.noUpdates')}</Text>
            ) : (
              <View style={styles.list}>
                {filteredItems.map((entry, idx) =>
                  entry.kind === 'case'
                    ? renderCaseItem(entry.item, idx)
                    : renderTrackingItem(entry.item, idx)
                )}
              </View>
            )}
          </>
        )}

      </ScrollView>

      {/* Add tracking modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isNewWound ? t('woundTracking.newWound') : t('woundTracking.addUpdate')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Color.Gray.v400} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              {isNewWound ? (
                <>
                  <Text style={styles.fieldLabel}>{t('fallOccurrence.injuryDescription')}<Text style={{ color: Color.Error.default }}> *</Text></Text>
                  <TextInput
                    style={styles.textInput}
                    multiline numberOfLines={4}
                    placeholder={t('fallOccurrence.describeInjuries')}
                    placeholderTextColor={Color.Gray.v300}
                    value={injuryDescription} onChangeText={setInjuryDescription}
                    textAlignVertical="top"
                  />
                  <Text style={styles.fieldLabel}>{t('woundTracking.bodyLocation')}<Text style={{ color: Color.Error.default }}> *</Text></Text>
                  <BodyLocationPicker
                    selected={selectedBodyLocations}
                    onChange={setSelectedBodyLocations}
                  />
                  <Text style={styles.fieldLabel}>{t('fallOccurrence.injuryPhoto')}</Text>
                  {pickedPhoto ? (
                    <View style={styles.pickedPhotoContainer}>
                      <Image source={{ uri: pickedPhoto.uri }} style={styles.pickedPhoto} resizeMode="cover" />
                      <TouchableOpacity style={styles.changePhotoBtn} onPress={showPhotoPicker}>
                        <Text style={styles.changePhotoBtnText}>{t('woundTracking.changePhoto')}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.photoPickerBtn} onPress={showPhotoPicker}>
                      <MaterialIcons name="add-a-photo" size={24} color={Color.primary} />
                      <Text style={styles.photoPickerText}>{t('fallOccurrence.addInjuryPhoto')}</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <>
              <Text style={styles.fieldLabel}>{t('woundTracking.notes')}</Text>
              <TextInput
                style={styles.textInput}
                multiline numberOfLines={4}
                placeholder={t('woundTracking.notesPlaceholder')}
                placeholderTextColor={Color.Gray.v300}
                value={notes} onChangeText={setNotes}
                textAlignVertical="top"
              />
              <View style={styles.switchRow}>
                <View style={styles.switchTextBlock}>
                  <Text style={styles.switchTitle}>{t('woundTracking.markResolved')}</Text>
                  <Text style={styles.switchDescription}>{t('woundTracking.markResolvedDescription')}</Text>
                </View>
                <Switch
                  value={isResolved} onValueChange={setIsResolved}
                  trackColor={{ false: Color.Gray.v200, true: Color.primary + '55' }}
                  thumbColor={isResolved ? Color.primary : Color.white}
                />
              </View>
              <Text style={styles.fieldLabel}>{t('woundTracking.photo')}</Text>
              {pickedPhoto ? (
                <View style={styles.pickedPhotoContainer}>
                  <Image source={{ uri: pickedPhoto.uri }} style={styles.pickedPhoto} resizeMode="cover" />
                  <TouchableOpacity style={styles.changePhotoBtn} onPress={showPhotoPicker}>
                    <Text style={styles.changePhotoBtnText}>{t('woundTracking.changePhoto')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.photoPickerBtn} onPress={showPhotoPicker}>
                  <MaterialIcons name="add-a-photo" size={24} color={Color.primary} />
                  <Text style={styles.photoPickerText}>{t('woundTracking.addPhoto')}</Text>
                </TouchableOpacity>
              )}
                </>
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={submitting}>
                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator size="small" color={Color.white} />
                  : <Text style={styles.submitBtnText}>{t('woundTracking.save')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Fullscreen photo */}
      {fullscreenPhoto && (
        <Modal visible animationType="fade" transparent onRequestClose={() => setFullscreenPhoto(null)}>
          <TouchableOpacity style={styles.fullscreenOverlay} activeOpacity={1} onPress={() => setFullscreenPhoto(null)}>
            <Image source={{ uri: fullscreenPhoto }} style={styles.fullscreenPhoto} resizeMode="contain" />
            <View style={styles.fullscreenClose}>
              <MaterialIcons name="close" size={28} color={Color.white} />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

export default ElderlyWoundTrackingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Color.Background.subtle },
  content: { ...spacingStyles.screenScrollContainer, gap: Spacing.sm_8 },

  // Header
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs_4, marginBottom: Spacing.xs_4 },
  screenTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.bodylarge_18, color: Color.primary },

  // Per-card add update button
  addUpdateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: Color.primary, borderRadius: Border.sm_8, paddingHorizontal: Spacing.sm_8, paddingVertical: Spacing.xs_4 },
  addUpdateBtnText: { fontFamily: FontFamily.medium, fontSize: FontSize.caption_12, color: Color.primary },
  resolveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: Color.Cyan?.v500 ?? Color.primary, borderRadius: Border.sm_8, paddingHorizontal: Spacing.sm_8, paddingVertical: Spacing.xs_4 },
  resolveBtnText: { fontFamily: FontFamily.medium, fontSize: FontSize.caption_12, color: Color.Cyan?.v500 ?? Color.primary },
  actionRow: { flexDirection: 'row', gap: Spacing.sm_8, flexWrap: 'wrap', marginTop: 4 },

  // Updates timeline
  updatesSection: { borderTopWidth: 1, borderTopColor: Color.Gray.v100, paddingTop: Spacing.sm_8, marginTop: Spacing.xs_4 },
  updatesSectionLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.caption_12, color: Color.Gray.v400, marginBottom: Spacing.xs_4 },
  updateItem: { flexDirection: 'row', gap: Spacing.sm_8, paddingVertical: Spacing.xs_4 },
  updateDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Color.primary, marginTop: 6, flexShrink: 0 },
  updateContent: { flex: 1 },
  updateDate: { fontFamily: FontFamily.medium, fontSize: FontSize.caption_12, color: Color.Gray.v400, marginBottom: 2 },

  // Filters
  filterRow: { flexDirection: 'row', gap: Spacing.xs_4, marginBottom: Spacing.sm_8 },
  filterTab: { paddingVertical: Spacing.xs_4 + 2, paddingHorizontal: Spacing.md_16, borderRadius: Border.sm_8, borderWidth: 1, borderColor: Color.Gray.v200, alignItems: 'center' },
  filterTabActive: { backgroundColor: Color.primary, borderColor: Color.primary },
  filterTabText: { fontFamily: FontFamily.medium, fontSize: FontSize.bodysmall_14, color: Color.Gray.v400, textAlign: 'center' },
  filterTabTextActive: { color: Color.white },

  // Empty / loader
  emptyText: { fontFamily: FontFamily.regular, fontSize: FontSize.bodymedium_16, color: Color.Gray.v300, textAlign: 'center', paddingVertical: Spacing.md_16 },

  // List
  list: { gap: Spacing.sm_8 },

  // Cards (shared)
  card: { backgroundColor: Color.white, borderRadius: Border.md_12, padding: Spacing.md_16, ...shadowStyles.cardShadow, gap: Spacing.sm_8 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardHeaderLeft: { flex: 1, gap: 2 },
  cardHeaderRight: { alignItems: 'flex-end', gap: 4, marginLeft: Spacing.sm_8 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  typeLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.caption_12, color: Color.Gray.v400, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateText: { fontFamily: FontFamily.semi_bold, fontSize: FontSize.bodysmall_14, color: Color.dark, marginTop: 2 },
  descriptionText: { fontFamily: FontFamily.regular, fontSize: FontSize.bodysmall_14, color: Color.Gray.v400 },

  // Status badge
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Border.full },
  statusOngoing: { backgroundColor: Color.Orange.v100 },
  statusResolved: { backgroundColor: Color.Cyan.v100 },
  statusText: { fontFamily: FontFamily.bold, fontSize: FontSize.caption_12, textTransform: 'uppercase', letterSpacing: 0.4 },
  statusOngoingText: { color: Color.Orange.v500 },
  statusResolvedText: { color: Color.Cyan.v500 },

  // Notes
  notesBox: { backgroundColor: Color.Background.subtle, borderRadius: Border.sm_8, padding: Spacing.sm_8 },
  notesLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.caption_12, color: Color.Gray.v400, marginBottom: 2 },
  notesText: { fontFamily: FontFamily.regular, fontSize: FontSize.bodysmall_14, color: Color.dark },

  // Photo
  photo: { width: '100%', height: 180, borderRadius: Border.sm_8 },
  tapToExpand: { fontFamily: FontFamily.regular, fontSize: FontSize.caption_12, color: Color.Gray.v400, textAlign: 'center', marginTop: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Color.white, borderTopLeftRadius: Border.lg_16, borderTopRightRadius: Border.lg_16, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md_16, borderBottomWidth: 1, borderBottomColor: Color.Gray.v100 },
  modalTitle: { fontFamily: FontFamily.semi_bold, fontSize: FontSize.bodylarge_18, color: Color.dark },
  modalBody: { padding: Spacing.md_16, gap: Spacing.sm_8 },
  fieldLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.bodysmall_14, color: Color.dark, marginBottom: 4 },
  textInput: { borderWidth: 1, borderColor: Color.Gray.v200, borderRadius: Border.sm_8, padding: Spacing.sm_8, fontFamily: FontFamily.regular, fontSize: FontSize.bodysmall_14, color: Color.dark, minHeight: 80 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm_8, paddingVertical: Spacing.xs_4 },
  switchTextBlock: { flex: 1 },
  switchTitle: { fontFamily: FontFamily.medium, fontSize: FontSize.bodysmall_14, color: Color.dark },
  switchDescription: { fontFamily: FontFamily.regular, fontSize: FontSize.caption_12, color: Color.Gray.v400 },
  photoPickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs_4, borderWidth: 1, borderColor: Color.primary, borderRadius: Border.sm_8, padding: Spacing.sm_8, borderStyle: 'dashed' },
  photoPickerText: { fontFamily: FontFamily.medium, fontSize: FontSize.bodysmall_14, color: Color.primary },
  pickedPhotoContainer: { gap: Spacing.xs_4 },
  pickedPhoto: { width: '100%', height: 160, borderRadius: Border.sm_8 },
  changePhotoBtn: { alignSelf: 'center' },
  changePhotoBtnText: { fontFamily: FontFamily.medium, fontSize: FontSize.bodysmall_14, color: Color.primary },
  modalFooter: { flexDirection: 'row', gap: Spacing.sm_8, padding: Spacing.md_16, borderTopWidth: 1, borderTopColor: Color.Gray.v100 },
  cancelBtn: { flex: 1, paddingVertical: Spacing.sm_8, borderRadius: Border.sm_8, borderWidth: 1, borderColor: Color.Gray.v200, alignItems: 'center' },
  cancelBtnText: { fontFamily: FontFamily.medium, fontSize: FontSize.bodysmall_14, color: Color.Gray.v400 },
  submitBtn: { flex: 1, paddingVertical: Spacing.sm_8, borderRadius: Border.sm_8, backgroundColor: Color.primary, alignItems: 'center' },
  submitBtnText: { fontFamily: FontFamily.medium, fontSize: FontSize.bodysmall_14, color: Color.white },

  // Fullscreen photo
  fullscreenOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fullscreenPhoto: { width: '100%', height: '80%' },
  fullscreenClose: { position: 'absolute', top: 48, right: 20 },
});
