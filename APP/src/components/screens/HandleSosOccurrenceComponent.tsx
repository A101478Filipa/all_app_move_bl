import React, { useState } from 'react';
import { VStack } from "@components/CoreComponents";
import { StyleSheet, Text, TextInput, View, Switch, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native";
import { Color } from '@src/styles/colors';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { PrimaryButton } from '@components/ButtonComponents';
import { shadowStyles } from '@src/styles/shadow';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { sosOccurrenceApi } from '@src/api/endpoints/sosOccurrences';
import BodyLocationPicker from '@components/BodyLocationPicker';

type Props = {
  onSubmit: (data: any) => void;
  loading?: boolean;
  sos?: any;
  occurrenceId: number;
};

const LabeledInput: React.FC<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  required?: boolean;
}> = ({ label, value, onChangeText, placeholder, required = false }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={Color.Gray.v300}
      value={value}
      onChangeText={onChangeText}
      multiline
      numberOfLines={4}
      textAlignVertical="top"
    />
  </View>
);

const HandleSosOccurrenceComponent: React.FC<Props> = ({ onSubmit, loading = false, sos, occurrenceId }) => {
  const { t } = useTranslation();
  
  // Estados base do SOS
  const [isFalseAlarm, setIsFalseAlarm] = useState(sos?.isFalseAlarm || false);
  const [wasActualFall, setWasActualFall] = useState(sos?.wasActualFall || false);
  const [notes, setNotes] = useState(sos?.notes || '');

  // Estados extra (iguais ao Fall Occurrence)
  const [recovery, setRecovery] = useState(sos?.recovery || '');
  const [preActivity, setPreActivity] = useState(sos?.preActivity || '');
  const [postActivity, setPostActivity] = useState(sos?.postActivity || '');
  const [direction, setDirection] = useState(sos?.direction || '');
  const [environment, setEnvironment] = useState(sos?.environment || '');
  const [injured, setInjured] = useState(sos?.injured || false);
  const [injuryDescription, setInjuryDescription] = useState(sos?.injuryDescription || '');
  const [injuryBodyLocations, setInjuryBodyLocations] = useState<string[]>([]);
  const [measuresTaken, setMeasuresTaken] = useState(sos?.measuresTaken || '');
  const [injuryPhotoUri, setInjuryPhotoUri] = useState<string | null>(sos?.injuryPhotoUrl || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [validationError, setValidationError] = useState<string | null>(null);

  const pickPhoto = async (fromCamera: boolean) => {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('fallOccurrence.permissionRequired'), t('fallOccurrence.cameraPermissionMessage'));
          return;
        }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('fallOccurrence.permissionRequired'), t('fallOccurrence.galleryPermissionMessage'));
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      }
      if (!result.canceled && result.assets.length > 0) {
        setInjuryPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Error picking photo:', e);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      t('fallOccurrence.injuryPhoto'),
      undefined,
      [
        { text: t('fallOccurrence.takePhoto'), onPress: () => pickPhoto(true) },
        { text: t('fallOccurrence.chooseFromGallery'), onPress: () => pickPhoto(false) },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!isFalseAlarm) {
      const missingFields =
        !measuresTaken.trim() ||
        (injured && !injuryDescription.trim()) ||
        (injured && injuryBodyLocations.length === 0);
      if (missingFields) {
        setValidationError(t('sosOccurrence.fillRequiredFields'));
        return;
      }
    }
    setValidationError(null);

    // Upload photo first if one was picked locally
    if (injured && injuryPhotoUri && injuryPhotoUri.startsWith('file')) {
      setUploadingPhoto(true);
      try {
        const formData = new FormData();
        const filename = injuryPhotoUri.split('/').pop() || 'photo.jpg';
        const ext = /\.(\w+)$/.exec(filename);
        formData.append('photo', { uri: injuryPhotoUri, name: filename, type: ext ? `image/${ext[1]}` : 'image/jpeg' } as any);
        await sosOccurrenceApi.uploadSosOccurrencePhoto(occurrenceId, formData);
      } catch (e) {
        console.error('Error uploading injury photo:', e);
      }
      setUploadingPhoto(false);
    }

    const payload = {
      isFalseAlarm,
      wasActualFall: isFalseAlarm ? false : wasActualFall,
      notes: notes || undefined,
      recovery: recovery || undefined,
      preActivity: preActivity || undefined,
      postActivity: postActivity || undefined,
      direction: wasActualFall ? (direction || undefined) : undefined,
      environment: environment || undefined,
      injured,
      injuryDescription: injured ? (injuryDescription || undefined) : undefined,
      injuryBodyLocations: injured ? injuryBodyLocations : [],
      measuresTaken: measuresTaken || undefined,
    };
    onSubmit(payload);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>{t('sosOccurrence.handleSosOccurrence')}</Text>
        <Text style={styles.subtitle}>{t('sosOccurrence.provideDetails')}</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Falso Alarme */}
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>{t('sosOccurrence.isFalseAlarm')}</Text>
          <Switch
            value={isFalseAlarm}
            onValueChange={setIsFalseAlarm}
            trackColor={{ false: Color.Gray.v200, true: Color.Warning.amber + '30' }}
            thumbColor={isFalseAlarm ? Color.Warning.amber : Color.Gray.v300}
          />
        </View>

        {isFalseAlarm && (
          <View style={styles.warningSection}>
            <Text style={styles.warningText}>{t('sosOccurrence.falseAlarmWarning')}</Text>
          </View>
        )}

        {!isFalseAlarm && (
          <>
            {/* Pergunta se foi Queda Real */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>{t('sosOccurrence.wasActualFall')}</Text>
              <Switch
                value={wasActualFall}
                onValueChange={setWasActualFall}
                trackColor={{ false: Color.Gray.v200, true: Color.primary + '30' }}
                thumbColor={wasActualFall ? Color.primary : Color.Gray.v300}
              />
            </View>

            <LabeledInput
              label={t('sosOccurrence.notes')}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('sosOccurrence.notesPlaceholder')}
            />

            <LabeledInput
              label={t('fallOccurrence.recoveryProcess')}
              value={recovery}
              onChangeText={setRecovery}
              placeholder={t('fallOccurrence.howWasPersonHelped')}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <LabeledInput
                  label={t('fallOccurrence.preActivity')}
                  value={preActivity}
                  onChangeText={setPreActivity}
                  placeholder={t('fallOccurrence.whatWasPersonDoing')}
                />
              </View>
              <View style={styles.halfWidth}>
                <LabeledInput
                  label={t('fallOccurrence.postActivity')}
                  value={postActivity}
                  onChangeText={setPostActivity}
                  placeholder={t('fallOccurrence.whatHappenedAfter')}
                />
              </View>
            </View>

            {/* DIREÇÃO DA QUEDA - SÓ APARECE SE FOR QUEDA REAL */}
            {wasActualFall && (
              <LabeledInput
                label={t('fallOccurrence.fallDirection')}
                value={direction}
                onChangeText={setDirection}
                placeholder={t('fallOccurrence.fallDirectionPlaceholder')}
              />
            )}

            <LabeledInput
              label={t('fallOccurrence.environment')}
              value={environment}
              onChangeText={setEnvironment}
              placeholder={t('fallOccurrence.environmentPlaceholder')}
            />

            {/* Secção de Ferimentos */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>{t('fallOccurrence.wasPersonInjured')}</Text>
              <Switch
                value={injured}
                onValueChange={setInjured}
                trackColor={{ false: Color.Gray.v200, true: Color.Error.default + '30' }}
                thumbColor={injured ? Color.Error.default : Color.Gray.v300}
              />
            </View>

            {injured && (
              <View style={styles.injurySection}>
                <LabeledInput
                  label={t('fallOccurrence.injuryDescription')}
                  value={injuryDescription}
                  onChangeText={setInjuryDescription}
                  placeholder={t('fallOccurrence.describeInjuries')}
                  required
                />

                <Text style={styles.label}>{t('woundTracking.bodyLocation')}<Text style={{ color: 'red' }}> *</Text></Text>
                <BodyLocationPicker
                  selected={injuryBodyLocations}
                  onChange={setInjuryBodyLocations}
                />

                {/* Photo picker */}
                <View style={styles.photoSection}>
                  <Text style={styles.label}>{t('fallOccurrence.injuryPhoto')}</Text>
                  {injuryPhotoUri ? (
                    <View style={styles.photoPreviewContainer}>
                      <Image source={{ uri: injuryPhotoUri }} style={styles.photoPreview} resizeMode="cover" />
                      <TouchableOpacity style={styles.removePhotoButton} onPress={() => setInjuryPhotoUri(null)}>
                        <Text style={styles.removePhotoText}>{t('fallOccurrence.removePhoto')}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.addPhotoButton} onPress={showPhotoOptions}>
                      <Text style={styles.addPhotoText}>📷  {t('fallOccurrence.addInjuryPhoto')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <LabeledInput
              label={t('fallOccurrence.measuresTaken')}
              value={measuresTaken}
              onChangeText={setMeasuresTaken}
              placeholder={t('fallOccurrence.whatActionsTaken')}
              required
            />
          </>
        )}
      </View>

      <View style={styles.buttonContainer}>
        {validationError && (
          <Text style={styles.validationError}>{validationError}</Text>
        )}
        {uploadingPhoto && (
          <View style={styles.uploadingRow}>
            <ActivityIndicator size="small" color={Color.primary} />
            <Text style={styles.uploadingText}>{t('fallOccurrence.uploadingPhoto')}</Text>
          </View>
        )}
        <PrimaryButton
          title={loading || uploadingPhoto ? t('common.generating') : t('sosOccurrence.submitReport')}
          onPress={handleSubmit}
        />
      </View>
    </ScrollView>
  );
};

// Mantém os estilos do HandleFallOccurrenceComponent que enviaste
const styles = StyleSheet.create({
  scrollContainer: { ...spacingStyles.screenScrollContainer },
  headerContainer: { marginBottom: Spacing.xl_32, alignItems: 'center' },
  header: { fontFamily: FontFamily.bold, fontSize: FontSize.heading3_24, color: Color.primary, textAlign: 'center', marginBottom: Spacing.sm_8 },
  subtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.bodymedium_16, color: Color.Gray.v400, textAlign: 'center', lineHeight: 22 },
  formContainer: { flex: 1, gap: Spacing.lg_24 },
  inputContainer: { gap: Spacing.sm_8 },
  label: { fontFamily: FontFamily.bold, fontSize: FontSize.bodymedium_16, color: Color.Gray.v500 },
  required: { color: Color.Error.default },
  input: { borderWidth: 1, borderColor: Color.Gray.v200, borderRadius: Border.md_12, padding: Spacing.md_16, fontSize: FontSize.bodymedium_16, backgroundColor: Color.white, minHeight: 100, ...shadowStyles.cardShadow },
  row: { flexDirection: 'row', gap: Spacing.md_16 },
  halfWidth: { flex: 1 },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Color.white, padding: Spacing.md_16, borderRadius: Border.md_12, borderWidth: 1, borderColor: Color.Gray.v200, ...shadowStyles.cardShadow },
  switchLabel: { fontFamily: FontFamily.bold, fontSize: FontSize.bodymedium_16, color: Color.Gray.v500 },
  injurySection: { backgroundColor: Color.Error.default + '10', padding: Spacing.md_16, borderRadius: Border.md_12, borderWidth: 1, borderColor: Color.Error.default + '30', gap: Spacing.md_16 },
  warningSection: { backgroundColor: Color.Warning.amber + '10', padding: Spacing.md_16, borderRadius: Border.md_12, borderWidth: 1, borderColor: Color.Warning.amber + '30' },
  warningText: { fontFamily: FontFamily.regular, fontSize: FontSize.bodysmall_14, color: Color.Gray.v500, textAlign: 'center' },
  buttonContainer: { marginTop: Spacing.xl_32, ...shadowStyles.floatingButtonShadow },
  validationError: { fontFamily: FontFamily.medium, fontSize: FontSize.bodysmall_14, color: Color.Error.default, textAlign: 'center', marginBottom: Spacing.sm_8 },
  photoSection: { gap: Spacing.sm_8 },
  addPhotoButton: { borderWidth: 1.5, borderColor: Color.primary + '60', borderStyle: 'dashed', borderRadius: Border.md_12, padding: Spacing.md_16, alignItems: 'center', backgroundColor: Color.primary + '05' },
  addPhotoText: { fontFamily: FontFamily.medium, fontSize: FontSize.bodymedium_16, color: Color.primary },
  photoPreviewContainer: { gap: Spacing.sm_8 },
  photoPreview: { width: '100%', height: 200, borderRadius: Border.md_12, backgroundColor: Color.Gray.v100 },
  removePhotoButton: { alignSelf: 'flex-end', paddingHorizontal: Spacing.md_16, paddingVertical: Spacing.xs_4, backgroundColor: Color.Error.default + '15', borderRadius: Border.sm_8 },
  removePhotoText: { fontFamily: FontFamily.medium, fontSize: FontSize.bodysmall_14, color: Color.Error.default },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm_8, marginBottom: Spacing.sm_8 },
  uploadingText: { fontFamily: FontFamily.medium, fontSize: FontSize.bodysmall_14, color: Color.primary },
});

export default HandleSosOccurrenceComponent;