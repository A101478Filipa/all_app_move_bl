import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, Modal, TextInput, Switch,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FallOccurrence } from 'moveplus-shared';
import FallOccurrenceRow from '@components/FallOccurrenceRow';
import { useElderlyDetailsStore } from '@src/stores/elderlyDetailsStore';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import ScreenState from '@src/constants/screenState';
import { useAuthStore } from '@src/stores/authStore';
import { UserRole } from 'moveplus-shared';
import { fallOccurrenceApi } from '@src/api/endpoints/fallOccurrences';
import { DatePickerInput } from '@components/DatePickerInput';
import BodyLocationPicker from '@components/BodyLocationPicker';
import { Border } from '@src/styles/borders';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

type Props = NativeStackScreenProps<any, 'ElderlyFallsList'>;

const ElderlyFallsListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { elderlyId } = route.params;
  const { t } = useTranslation();
  const { elderly, state, refreshElderly, fetchElderly } = useElderlyDetailsStore();
  const { user } = useAuthStore();
  const role = user?.user?.role;

  useEffect(() => {
    if (!elderly || elderly.id !== elderlyId) {
      fetchElderly(elderlyId);
    }
  }, [elderlyId]);

  const canAddFall = [
    UserRole.INSTITUTION_ADMIN,
    UserRole.CAREGIVER,
    UserRole.CLINICIAN,
  ].includes(role as UserRole);

  const falls: FallOccurrence[] = elderly?.fallOccurrences ?? [];

  // Add Fall modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [recovery, setRecovery] = useState('');
  const [preActivity, setPreActivity] = useState('');
  const [postActivity, setPostActivity] = useState('');
  const [direction, setDirection] = useState('');
  const [environment, setEnvironment] = useState('');
  const [injured, setInjured] = useState(false);
  const [injuryDescription, setInjuryDescription] = useState('');
  const [injuryBodyLocations, setInjuryBodyLocations] = useState<string[]>([]);
  const [injuryPhoto, setInjuryPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [measuresTaken, setMeasuresTaken] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const openModal = () => {
    setDate(new Date());
    setDescription('');
    setRecovery('');
    setPreActivity('');
    setPostActivity('');
    setDirection('');
    setEnvironment('');
    setInjured(false);
    setInjuryDescription('');
    setInjuryBodyLocations([]);
    setInjuryPhoto(null);
    setMeasuresTaken('');
    setValidationError(null);
    setModalVisible(true);
  };

  // Auto-open from navigation param
  React.useEffect(() => {
    if ((route.params as any)?.openModal) {
      openModal();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showInjuryPhotoPicker = () => {
    const pickFrom = async (fromCamera: boolean) => {
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
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const name = asset.uri.split('/').pop() || 'injury.jpg';
        const ext = name.match(/\.([a-zA-Z]+)$/);
        setInjuryPhoto({ uri: asset.uri, name, type: ext ? `image/${ext[1]}` : 'image/jpeg' });
      }
    };
    Alert.alert(
      t('fallOccurrence.injuryPhoto'),
      undefined,
      [
        { text: t('fallOccurrence.takePhoto'), onPress: () => pickFrom(true) },
        { text: t('fallOccurrence.chooseFromGallery'), onPress: () => pickFrom(false) },
        ...(injuryPhoto ? [{ text: t('fallOccurrence.removePhoto'), style: 'destructive' as const, onPress: () => setInjuryPhoto(null) }] : []),
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleAddFall = async () => {
    const missing =
      !description.trim() ||
      !measuresTaken.trim() ||
      (injured && !injuryDescription.trim()) ||
      (injured && injuryBodyLocations.length === 0);
    if (missing) {
      setValidationError(t('fallOccurrence.fillRequiredFields'));
      return;
    }
    setValidationError(null);
    setSubmitting(true);
    try {
      const res = await fallOccurrenceApi.createFallOccurrence(elderlyId, {
        date,
        description: description.trim() || undefined,
        recovery: recovery.trim() || undefined,
        preActivity: preActivity.trim() || undefined,
        postActivity: postActivity.trim() || undefined,
        direction: direction.trim() || undefined,
        environment: environment.trim() || undefined,
        injured,
        injuryDescription: injured ? (injuryDescription.trim() || undefined) : undefined,
        injuryBodyLocations: injured ? injuryBodyLocations : [],
        measuresTaken: measuresTaken.trim() || undefined,
      });
      if (injured && injuryPhoto && res.data?.id) {
        try {
          setUploadingPhoto(true);
          const formData = new FormData();
          formData.append('photo', { uri: injuryPhoto.uri, name: injuryPhoto.name, type: injuryPhoto.type } as any);
          await fallOccurrenceApi.uploadFallOccurrencePhoto(res.data.id, formData);
        } catch (photoError) {
          console.error('Error uploading injury photo:', photoError);
        } finally {
          setUploadingPhoto(false);
        }
      }
      setModalVisible(false);
      await refreshElderly(elderlyId);
    } catch (e) {
      console.error('Error creating fall occurrence:', e);
      Alert.alert(t('fallOccurrence.failedToLoad'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFallPress = (fall: FallOccurrence) => {
    navigation.push('FallOccurrenceScreen', { occurrenceId: fall.id });
  };

  React.useLayoutEffect(() => {
    if (canAddFall) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity style={styles.headerButton} onPress={openModal}>
            <MaterialIcons name="add" size={24} color={Color.Background.white} />
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, canAddFall]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={state === ScreenState.REFRESHING}
            onRefresh={() => refreshElderly(elderlyId)}
          />
        }
      >
        {falls.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="person-off" size={48} color={Color.Gray.v300} />
            <Text style={styles.emptyText}>{t('elderly.noFalls')}</Text>
          </View>
        ) : (
          falls.map(fall => (
            <FallOccurrenceRow
              key={fall.id}
              fall={fall}
              onPress={handleFallPress}
            />
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('elderly.addFall')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Color.Gray.v400} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>{t('fallOccurrence.date')}</Text>
              <DatePickerInput
                label={t('fallOccurrence.date')}
                value={date}
                onChange={setDate}
              />

              <Text style={styles.fieldLabel}>{t('fallOccurrence.description')}<Text style={{ color: 'red' }}> *</Text></Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={3}
                placeholder={t('fallOccurrence.describeWhatHappened')}
                placeholderTextColor={Color.Gray.v300}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>{t('fallOccurrence.recoveryProcess')}</Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={3}
                placeholder={t('fallOccurrence.howWasPersonHelped')}
                placeholderTextColor={Color.Gray.v300}
                value={recovery}
                onChangeText={setRecovery}
                textAlignVertical="top"
              />

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.fieldLabel}>{t('fallOccurrence.preActivity')}</Text>
                  <TextInput
                    style={styles.textInput}
                    multiline
                    numberOfLines={3}
                    placeholder={t('fallOccurrence.whatWasPersonDoing')}
                    placeholderTextColor={Color.Gray.v300}
                    value={preActivity}
                    onChangeText={setPreActivity}
                    textAlignVertical="top"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.fieldLabel}>{t('fallOccurrence.postActivity')}</Text>
                  <TextInput
                    style={styles.textInput}
                    multiline
                    numberOfLines={3}
                    placeholder={t('fallOccurrence.whatHappenedAfter')}
                    placeholderTextColor={Color.Gray.v300}
                    value={postActivity}
                    onChangeText={setPostActivity}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.fieldLabel}>{t('fallOccurrence.fallDirection')}</Text>
                  <TextInput
                    style={styles.textInput}
                    multiline
                    numberOfLines={3}
                    placeholder={t('fallOccurrence.fallDirectionPlaceholder')}
                    placeholderTextColor={Color.Gray.v300}
                    value={direction}
                    onChangeText={setDirection}
                    textAlignVertical="top"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.fieldLabel}>{t('fallOccurrence.environment')}</Text>
                  <TextInput
                    style={styles.textInput}
                    multiline
                    numberOfLines={3}
                    placeholder={t('fallOccurrence.environmentPlaceholder')}
                    placeholderTextColor={Color.Gray.v300}
                    value={environment}
                    onChangeText={setEnvironment}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t('fallOccurrence.wasPersonInjured')}</Text>
                <Switch
                  value={injured}
                  onValueChange={(val) => {
                    setInjured(val);
                    if (!val) { setInjuryDescription(''); setInjuryBodyLocations([]); setInjuryPhoto(null); }
                  }}
                  trackColor={{ false: Color.Gray.v200, true: Color.primary + '55' }}
                  thumbColor={injured ? Color.primary : Color.white}
                />
              </View>

              {injured && (
                <View style={styles.injurySection}>
                  <Text style={styles.fieldLabel}>{t('fallOccurrence.injuryDescription')}<Text style={{ color: 'red' }}> *</Text></Text>
                  <TextInput
                    style={styles.textInput}
                    multiline
                    numberOfLines={3}
                    placeholder={t('fallOccurrence.describeInjuries')}
                    placeholderTextColor={Color.Gray.v300}
                    value={injuryDescription}
                    onChangeText={setInjuryDescription}
                    textAlignVertical="top"
                  />
                  <Text style={styles.fieldLabel}>{t('woundTracking.bodyLocation')}<Text style={{ color: 'red' }}> *</Text></Text>
                  <BodyLocationPicker
                    selected={injuryBodyLocations}
                    onChange={setInjuryBodyLocations}
                  />
                  <TouchableOpacity style={styles.photoPickerBtn} onPress={showInjuryPhotoPicker}>
                    {injuryPhoto ? (
                      <Image source={{ uri: injuryPhoto.uri }} style={styles.injuryPhotoPreview} resizeMode="cover" />
                    ) : (
                      <>
                        <MaterialIcons name="add-a-photo" size={20} color={Color.primary} />
                        <Text style={styles.photoPickerText}>{t('fallOccurrence.addInjuryPhoto')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.fieldLabel}>{t('fallOccurrence.measuresTaken')}<Text style={{ color: 'red' }}> *</Text></Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={3}
                placeholder={t('fallOccurrence.whatActionsTaken')}
                placeholderTextColor={Color.Gray.v300}
                value={measuresTaken}
                onChangeText={setMeasuresTaken}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              {validationError && (
                <Text style={styles.validationError}>{validationError}</Text>
              )}
              <View style={styles.footerButtons}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                  disabled={submitting || uploadingPhoto}
                >
                  <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleAddFall}
                  disabled={submitting || uploadingPhoto}
                >
                  {(submitting || uploadingPhoto)
                    ? <ActivityIndicator size="small" color={Color.white} />
                    : <Text style={styles.submitBtnText}>{t('common.save')}</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default ElderlyFallsListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  content: {
    ...spacingStyles.screenScrollContainer,
    gap: Spacing.md_16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl_32,
    gap: Spacing.sm_8,
  },
  emptyText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: Border.sm_8,
    backgroundColor: Color.Orange.v300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    backgroundColor: Color.Background.white,
    borderTopLeftRadius: Border.lg_16,
    borderTopRightRadius: Border.lg_16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md_16,
    borderBottomWidth: 1,
    borderBottomColor: Color.Gray.v100,
  },
  modalTitle: {
    fontSize: FontSize.subtitle_20,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
  },
  modalBody: {
    padding: Spacing.md_16,
    gap: Spacing.sm_8,
  },
  fieldLabel: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v500,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    borderRadius: Border.sm_8,
    padding: Spacing.sm_12,
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.dark,
    minHeight: 80,
    marginBottom: Spacing.sm_8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm_8,
  },
  switchLabel: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.dark,
    flex: 1,
  },
  modalFooter: {
    padding: Spacing.md_16,
    borderTopWidth: 1,
    borderTopColor: Color.Gray.v100,
    gap: Spacing.xs_4,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: Spacing.sm_12,
  },
  validationError: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.medium,
    color: 'red',
    textAlign: 'center',
    paddingBottom: Spacing.xs_4,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: Spacing.sm_8,
  },
  halfInput: {
    flex: 1,
  },
  injurySection: {
    borderTopWidth: 1,
    borderTopColor: Color.Gray.v100,
    paddingTop: Spacing.sm_12,
    marginTop: Spacing.xs_4,
    gap: Spacing.xs_4,
  },
  cancelBtn: {
    flex: 1,
    padding: Spacing.sm_12,
    borderRadius: Border.sm_8,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v500,
  },
  submitBtn: {
    flex: 1,
    padding: Spacing.sm_12,
    borderRadius: Border.sm_8,
    backgroundColor: Color.primary,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.white,
  },
  woundSection: {
    borderTopWidth: 1,
    borderTopColor: Color.Gray.v100,
    paddingTop: Spacing.sm_12,
    marginTop: Spacing.xs_4,
    gap: Spacing.xs_4,
  },
  photoPickerBtn: {
    borderWidth: 1,
    borderColor: Color.primary + '66',
    borderStyle: 'dashed',
    borderRadius: Border.sm_8,
    padding: Spacing.sm_12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs_4,
    minHeight: 56,
  },
  photoPickerText: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.medium,
    color: Color.primary,
  },
  woundPhotoPreview: {
    width: '100%',
    height: 120,
    borderRadius: Border.sm_8,
  },
  injuryPhotoPreview: {
    width: '100%',
    height: 120,
    borderRadius: Border.sm_8,
  },
});
