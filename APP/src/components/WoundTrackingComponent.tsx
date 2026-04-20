import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { shadowStyles } from '@src/styles/shadow';
import { buildAvatarUrl } from '@src/services/ApiService';
import { woundTrackingApi, WoundTracking } from '@src/api/endpoints/woundTracking';

type OccurrenceType = 'fall' | 'sos' | 'elderly';

type Props = {
  occurrenceId: number;
  occurrenceType: OccurrenceType;
  canAdd?: boolean;
  canDelete?: boolean;
};

type FilterTab = 'all' | 'ongoing' | 'resolved';

const WoundTrackingComponent: React.FC<Props> = ({ occurrenceId, occurrenceType, canAdd = false, canDelete = false }) => {
  const { t } = useTranslation();
  const [trackings, setTrackings] = useState<WoundTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [notes, setNotes] = useState('');
  const [isResolved, setIsResolved] = useState(false);
  const [pickedPhoto, setPickedPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  const fetchTrackings = useCallback(async () => {
    setLoading(true);
    try {
      const res = occurrenceType === 'fall'
        ? await woundTrackingApi.getFallWoundTrackings(occurrenceId)
        : occurrenceType === 'sos'
        ? await woundTrackingApi.getSosWoundTrackings(occurrenceId)
        : await woundTrackingApi.getElderlyWoundTrackings(occurrenceId);
      setTrackings(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setTrackings([]);
    } finally {
      setLoading(false);
    }
  }, [occurrenceId, occurrenceType]);

  useEffect(() => { fetchTrackings(); }, [fetchTrackings]);

  const filteredTrackings = trackings.filter(item => {
    if (activeFilter === 'ongoing') return !item.isResolved;
    if (activeFilter === 'resolved') return item.isResolved;
    return true;
  });

  const openModal = () => {
    setNotes('');
    setIsResolved(false);
    setPickedPhoto(null);
    setModalVisible(true);
  };

  const pickPhoto = (fromCamera: boolean) => {
    const doPickFrom = async () => {
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
    doPickFrom();
  };

  const showPhotoPicker = () => {
    Alert.alert(
      t('woundTracking.photo'),
      undefined,
      [
        { text: t('fallOccurrence.takePhoto'), onPress: () => pickPhoto(true) },
        { text: t('fallOccurrence.chooseFromGallery'), onPress: () => pickPhoto(false) },
        ...(pickedPhoto ? [{ text: t('woundTracking.removePhoto'), style: 'destructive' as const, onPress: () => setPickedPhoto(null) }] : []),
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!notes.trim() && !pickedPhoto && !isResolved) {
      Alert.alert(t('woundTracking.errorEmpty'));
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (notes.trim()) formData.append('notes', notes.trim());
      formData.append('isResolved', String(isResolved));
      if (pickedPhoto) {
        formData.append('photo', { uri: pickedPhoto.uri, name: pickedPhoto.name, type: pickedPhoto.type } as any);
      }
      const res = occurrenceType === 'fall'
        ? await woundTrackingApi.addFallWoundTracking(occurrenceId, formData)
        : occurrenceType === 'sos'
        ? await woundTrackingApi.addSosWoundTracking(occurrenceId, formData)
        : await woundTrackingApi.addElderlyWoundTracking(occurrenceId, formData);
      if (res.data) {
        setTrackings(prev => [res.data, ...prev]);
        setModalVisible(false);
      }
    } catch (e) {
      console.error('Error adding wound tracking:', e);
      Alert.alert(t('woundTracking.uploadFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (trackingId: number) => {
    Alert.alert(
      t('woundTracking.deleteTitle'),
      t('woundTracking.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await woundTrackingApi.deleteWoundTracking(trackingId);
              setTrackings(prev => prev.filter(t => t.id !== trackingId));
            } catch (e) {
              console.error('Error deleting wound tracking:', e);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderTrackingCard = (item: WoundTracking) => (
    <View key={item.id} style={styles.trackingCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemHeaderMain}>
          <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
          <View style={[styles.statusBadge, item.isResolved ? styles.statusResolved : styles.statusOngoing]}>
            <Text style={[styles.statusBadgeText, item.isResolved ? styles.statusResolvedText : styles.statusOngoingText]}>
              {item.isResolved ? t('woundTracking.resolved') : t('woundTracking.ongoing')}
            </Text>
          </View>
        </View>
        {canDelete && (
          <TouchableOpacity onPress={() => confirmDelete(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="delete-outline" size={18} color={Color.Error.default} />
          </TouchableOpacity>
        )}
      </View>

      {item.notes ? (
        <View style={styles.notesCard}>
          <Text style={styles.notesLabel}>{t('woundTracking.notes')}</Text>
          <Text style={styles.notes}>{item.notes}</Text>
        </View>
      ) : null}

      {item.photoUrl ? (
        <TouchableOpacity style={styles.photoBlock} onPress={() => setFullscreenPhoto(buildAvatarUrl(item.photoUrl!))}>
          <Image
            source={{ uri: buildAvatarUrl(item.photoUrl) }}
            style={styles.photo}
            resizeMode="cover"
          />
          <Text style={styles.tapToExpand}>{t('woundTracking.tapToExpand')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Title row */}
      <View style={styles.headerLeft}>
        <MaterialIcons name="healing" size={20} color={Color.primary} />
        <Text style={styles.title}>{t('woundTracking.title')}</Text>
      </View>

      {/* Filter tabs */}
      {!loading && trackings.length > 0 && (
        <View style={styles.filterRow}>
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
        </View>
      )}

      {/* Add button below title */}
      {canAdd && (
        <TouchableOpacity style={styles.addButton} onPress={openModal}>
          <MaterialIcons name="add" size={18} color={Color.white} />
          <Text style={styles.addButtonText}>{t('woundTracking.addUpdate')}</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="small" color={Color.primary} style={styles.loader} />
      ) : filteredTrackings.length === 0 ? (
        <Text style={styles.emptyText}>{t('woundTracking.noUpdates')}</Text>
      ) : (
        <View style={styles.timeline}>
          {filteredTrackings.map(renderTrackingCard)}
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('woundTracking.addUpdate')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Color.Gray.v400} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>{t('woundTracking.notes')}</Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={4}
                placeholder={t('woundTracking.notesPlaceholder')}
                placeholderTextColor={Color.Gray.v300}
                value={notes}
                onChangeText={setNotes}
                textAlignVertical="top"
              />

              <View style={styles.switchRow}>
                <View style={styles.switchTextBlock}>
                  <Text style={styles.switchTitle}>{t('woundTracking.markResolved')}</Text>
                  <Text style={styles.switchDescription}>{t('woundTracking.markResolvedDescription')}</Text>
                </View>
                <Switch
                  value={isResolved}
                  onValueChange={setIsResolved}
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
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={submitting}>
                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator size="small" color={Color.white} />
                  : <Text style={styles.submitBtnText}>{t('woundTracking.save')}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    backgroundColor: Color.white,
    borderRadius: Border.lg_16,
    padding: Spacing.lg_24,
    ...shadowStyles.cardShadow,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs_4,
    marginBottom: Spacing.sm_8,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs_4,
    backgroundColor: Color.primary,
    paddingHorizontal: Spacing.sm_8,
    paddingVertical: Spacing.xs_4 + 2,
    borderRadius: Border.sm_8,
    marginBottom: Spacing.md_16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.xs_4,
    marginBottom: Spacing.sm_12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.xs_4 + 2,
    paddingHorizontal: Spacing.xs_4,
    borderRadius: Border.sm_8,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: Color.primary,
    borderColor: Color.primary,
  },
  filterTabText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14 - 1,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
  filterTabTextActive: {
    color: Color.white,
  },
  addButtonText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.white,
  },
  loader: {
    marginVertical: Spacing.md_16,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v300,
    textAlign: 'center',
    paddingVertical: Spacing.md_16,
  },
  timeline: {
    gap: Spacing.md_16,
  },
  trackingCard: {
    borderWidth: 1,
    borderColor: Color.Gray.v100,
    borderRadius: Border.md_12,
    padding: Spacing.md_16,
    backgroundColor: Color.Background.white,
    gap: Spacing.sm_8,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemHeaderMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm_8,
    flexWrap: 'wrap',
  },
  itemDate: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.primary,
  },
  statusBadge: {
    borderRadius: Border.sm_8,
    paddingHorizontal: Spacing.sm_8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodysmall_14 - 1,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statusResolved: {
    backgroundColor: Color.Cyan.v100,
  },
  statusResolvedText: {
    color: Color.Cyan.v500,
  },
  statusOngoing: {
    backgroundColor: Color.Orange.v100,
  },
  statusOngoingText: {
    color: Color.Orange.v500,
  },
  notesCard: {
    backgroundColor: Color.Gray.v100,
    borderRadius: Border.sm_8,
    padding: Spacing.sm_8,
  },
  notesLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodysmall_14 - 1,
    color: Color.Gray.v400,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  notes: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
    lineHeight: 22,
  },
  photoBlock: {
    gap: 2,
  },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: Border.md_12,
    backgroundColor: Color.Gray.v100,
  },
  tapToExpand: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14 - 1,
    color: Color.Gray.v300,
    textAlign: 'right',
    marginTop: 2,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Color.white,
    borderTopLeftRadius: Border.xl_24,
    borderTopRightRadius: Border.xl_24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg_24,
    borderBottomWidth: 1,
    borderBottomColor: Color.Gray.v100,
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.Gray.v500,
  },
  modalBody: {
    padding: Spacing.lg_24,
    gap: Spacing.sm_8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm_8,
    marginBottom: Spacing.md_16,
    padding: Spacing.sm_8,
    borderRadius: Border.md_12,
    backgroundColor: Color.Background.cyanTint,
  },
  switchTextBlock: {
    flex: 1,
    gap: 2,
  },
  switchTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
  },
  switchDescription: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
  },
  fieldLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    borderRadius: Border.md_12,
    padding: Spacing.sm_8,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
    minHeight: 100,
    marginBottom: Spacing.md_16,
  },
  photoPickerBtn: {
    borderWidth: 1.5,
    borderColor: Color.primary + '60',
    borderStyle: 'dashed',
    borderRadius: Border.md_12,
    padding: Spacing.md_16,
    alignItems: 'center',
    gap: Spacing.xs_4,
    backgroundColor: Color.primary + '05',
  },
  photoPickerText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodymedium_16,
    color: Color.primary,
  },
  pickedPhotoContainer: {
    gap: Spacing.xs_4,
  },
  pickedPhoto: {
    width: '100%',
    height: 180,
    borderRadius: Border.md_12,
    backgroundColor: Color.Gray.v100,
  },
  changePhotoBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.xs_4,
    backgroundColor: Color.primary + '15',
    borderRadius: Border.sm_8,
  },
  changePhotoBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.lg_24,
    paddingTop: Spacing.md_16,
    gap: Spacing.sm_8,
    borderTopWidth: 1,
    borderTopColor: Color.Gray.v100,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md_16,
    borderRadius: Border.md_12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Color.Gray.v200,
  },
  cancelBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v400,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: Spacing.md_16,
    borderRadius: Border.md_12,
    alignItems: 'center',
    backgroundColor: Color.primary,
  },
  submitBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.white,
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenPhoto: {
    width: '100%',
    height: '80%',
  },
  fullscreenClose: {
    position: 'absolute',
    top: 48,
    right: 20,
  },
});

export default WoundTrackingComponent;
