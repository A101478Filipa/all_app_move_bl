import React, { useState } from 'react';
import { VStack } from "@components/CoreComponents";
import { StyleSheet, Text, TextInput, View, Switch, ScrollView } from "react-native";
import { Color } from '@src/styles/colors';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { PrimaryButton } from '@components/ButtonComponents';
import { shadowStyles } from '@src/styles/shadow';
import { useTranslation } from 'react-i18next';

type Props = {
  onSubmit: (data: any) => void;
  loading?: boolean;
  sos?: any;
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

const HandleSosOccurrenceComponent: React.FC<Props> = ({ onSubmit, loading = false, sos }) => {
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
  const [measuresTaken, setMeasuresTaken] = useState(sos?.measuresTaken || '');

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!isFalseAlarm) {
      const missingFields =
        !measuresTaken.trim() ||
        (injured && !injuryDescription.trim());
      if (missingFields) {
        setValidationError(t('sosOccurrence.fillRequiredFields'));
        return;
      }
    }
    setValidationError(null);
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
        <PrimaryButton
          title={loading ? t('common.generating') : t('sosOccurrence.submitReport')}
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
  injurySection: { backgroundColor: Color.Error.default + '10', padding: Spacing.md_16, borderRadius: Border.md_12, borderWidth: 1, borderColor: Color.Error.default + '30' },
  warningSection: { backgroundColor: Color.Warning.amber + '10', padding: Spacing.md_16, borderRadius: Border.md_12, borderWidth: 1, borderColor: Color.Warning.amber + '30' },
  warningText: { fontFamily: FontFamily.regular, fontSize: FontSize.bodysmall_14, color: Color.Gray.v500, textAlign: 'center' },
  buttonContainer: { marginTop: Spacing.xl_32, ...shadowStyles.floatingButtonShadow },
  validationError: { fontFamily: FontFamily.medium, fontSize: FontSize.bodysmall_14, color: Color.Error.default, textAlign: 'center', marginBottom: Spacing.sm_8 },
});

export default HandleSosOccurrenceComponent;