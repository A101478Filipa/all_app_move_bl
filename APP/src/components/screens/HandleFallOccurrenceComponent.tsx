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
import { FallOccurrence } from 'moveplus-shared';

type Props = {
  onSubmit: (data: any) => void;
  loading?: boolean;
  fall?: FallOccurrence;
};

// MARK: LabeledInput Component
interface LabeledInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  style?: any;
  required?: boolean;
}

const LabeledInput: React.FC<LabeledInputProps> = ({ label, value, onChangeText, placeholder, required = false }) => (
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
      multiline={true}
      numberOfLines={4}
      textAlignVertical="top"
    />
  </View>
);

const HandleFallOccurrenceComponent: React.FC<Props> = ({ onSubmit, loading = false, fall }) => {
  const { t } = useTranslation();
  const [description, setDescription] = useState(fall?.description || '');
  const [recovery, setRecovery] = useState(fall?.recovery || '');
  const [preActivity, setPreActivity] = useState(fall?.preActivity || '');
  const [postActivity, setPostActivity] = useState(fall?.postActivity || '');
  const [direction, setDirection] = useState(fall?.direction || '');
  const [environment, setEnvironment] = useState(fall?.environment || '');
  const [injured, setInjured] = useState(fall?.injured || false);
  const [injuryDescription, setInjuryDescription] = useState(fall?.injuryDescription || '');
  const [measuresTaken, setMeasuresTaken] = useState(fall?.measuresTaken || '');
  const [isFalseAlarm, setIsFalseAlarm] = useState(fall?.isFalseAlarm || false);

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = () => {
    const missingFields =
      !description.trim() ||
      (!isFalseAlarm && !measuresTaken.trim()) ||
      (!isFalseAlarm && injured && !injuryDescription.trim());
    if (missingFields) {
      setValidationError(t('fallOccurrence.fillRequiredFields'));
      return;
    }
    setValidationError(null);
    const payload = {
      description: description || null,
      recovery: recovery || null,
      preActivity: preActivity || null,
      postActivity: postActivity || null,
      direction: direction || null,
      environment: environment || null,
      injured,
      measuresTaken: measuresTaken || null,
      injuryDescription: injured ? (injuryDescription || null) : null,
      isFalseAlarm,
    };

    const filteredPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, value]) => value != null && value !== '')
    );

    onSubmit(filteredPayload);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.header}>{t('fallOccurrence.handleFallOccurrence')}</Text>
        <Text style={styles.subtitle}>{t('fallOccurrence.provideDetails')}</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>{t('fallOccurrence.markAsFalseAlarm')}</Text>
          <Switch
            value={isFalseAlarm}
            onValueChange={setIsFalseAlarm}
            trackColor={{ false: Color.Gray.v200, true: Color.Warning.amber + '30' }}
            thumbColor={isFalseAlarm ? Color.Warning.amber : Color.Gray.v300}
          />
        </View>

        {isFalseAlarm && (
          <View style={styles.warningSection}>
            <Text style={styles.warningText}>
              {t('fallOccurrence.falseAlarmWarning')}
            </Text>
          </View>
        )}

        <LabeledInput
          label={t('fallOccurrence.description')}
          value={description}
          onChangeText={setDescription}
          placeholder={t('fallOccurrence.describeWhatHappened')}
          required
        />

        {!isFalseAlarm && (
          <>
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

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <LabeledInput
                  label={t('fallOccurrence.fallDirection')}
                  value={direction}
                  onChangeText={setDirection}
                  placeholder={t('fallOccurrence.fallDirectionPlaceholder')}
                />
              </View>
              <View style={styles.halfWidth}>
                <LabeledInput
                  label={t('fallOccurrence.environment')}
                  value={environment}
                  onChangeText={setEnvironment}
                  placeholder={t('fallOccurrence.environmentPlaceholder')}
                />
              </View>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>{t('fallOccurrence.wasPersonInjured')}</Text>
              <Switch
                value={injured}
                onValueChange={setInjured}
                trackColor={{ false: Color.Gray.v200, true: Color.primary + '30' }}
                thumbColor={injured ? Color.primary : Color.Gray.v300}
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
          title={t('fallOccurrence.submitReport')}
          onPress={handleSubmit}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    ...spacingStyles.screenScrollContainer,
  },
  headerContainer: {
    marginBottom: Spacing.xl_32,
    alignItems: 'center',
  },
  header: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.heading3_24,
    color: Color.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm_8,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v400,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    gap: Spacing.lg_24,
  },
  inputContainer: {
    gap: Spacing.sm_8,
  },
  label: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
  },
  required: {
    color: Color.Error.default,
  },
  input: {
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    borderRadius: Border.md_12,
    padding: Spacing.md_16,
    fontSize: FontSize.bodymedium_16,
    backgroundColor: Color.white,
    minHeight: 100,
    ...shadowStyles.cardShadow,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md_16,
  },
  halfWidth: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Color.white,
    padding: Spacing.md_16,
    borderRadius: Border.md_12,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    ...shadowStyles.cardShadow,
  },
  switchLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
  },
  injurySection: {
    backgroundColor: Color.Error.default + '10',
    padding: Spacing.md_16,
    borderRadius: Border.md_12,
    borderWidth: 1,
    borderColor: Color.Error.default + '30',
  },
  warningSection: {
    backgroundColor: Color.Warning.amber + '10',
    padding: Spacing.md_16,
    borderRadius: Border.md_12,
    borderWidth: 1,
    borderColor: Color.Warning.amber + '30',
  },
  warningText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: Spacing.xl_32,
    ...shadowStyles.floatingButtonShadow,
  },
  validationError: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.Error.default,
    textAlign: 'center',
    marginBottom: Spacing.sm_8,
  },
});

export default HandleFallOccurrenceComponent;