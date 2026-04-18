import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useElderlyDetailsStore } from '@src/stores';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { VStack } from '@components/CoreComponents';
import { CreatePathologyRequest, PathologyStatus } from 'moveplus-shared';
import { PrimaryButton } from '@components/ButtonComponents';
import { FormTextInput } from '@components/forms/FormTextInput';
import { FormDateInput } from '@components/forms/FormDateInput';
import { FormDropdown } from '@components/forms/FormDropdown';
import { useErrorHandler } from '@src/hooks/useErrorHandler';
import { useTranslation } from 'react-i18next';

type AddPathologyScreenProps = NativeStackScreenProps<any, 'AddPathology'>;

interface PathologyForm {
  name: string | null;
  description: string | null;
  diagnosisSite: string | null;
  diagnosisDate: string | null;
  status: PathologyStatus | null;
  notes: string | null;
}

const getPathologyStatuses = (t: any) => [
  { label: t('pathology.statusOptions.active'), value: PathologyStatus.ACTIVE },
  { label: t('pathology.statusOptions.inactive'), value: PathologyStatus.INACTIVE },
  { label: t('pathology.statusOptions.chronic'), value: PathologyStatus.CHRONIC },
  { label: t('pathology.statusOptions.resolved'), value: PathologyStatus.RESOLVED },
  { label: t('pathology.statusOptions.under_treatment'), value: PathologyStatus.UNDER_TREATMENT },
  { label: t('pathology.statusOptions.monitoring'), value: PathologyStatus.MONITORING },
];

const AddPathologyScreen: React.FC<AddPathologyScreenProps> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { elderlyId } = route.params;
  const [loading, setLoading] = useState(false);
  const { addPathology } = useElderlyDetailsStore();
  const { handleError, handleSuccess, handleValidationError } = useErrorHandler();
  const insets = useSafeAreaInsets();

  const pathologyStatuses = getPathologyStatuses(t);
  const [form, setForm] = useState<PathologyForm>({
    name: null,
    description: null,
    diagnosisSite: null,
    diagnosisDate: null,
    status: PathologyStatus.ACTIVE,
    notes: null,
  });

  const handleInputChange = (field: keyof PathologyForm, value: string | PathologyStatus) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      handleValidationError(t('pathology.conditionNameRequired'));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const pathologyData: CreatePathologyRequest = {
        name: form.name,
        description: form.description,
        diagnosisSite: form.diagnosisSite,
        diagnosisDate: form.diagnosisDate ? new Date(form.diagnosisDate) : undefined,
        status: form.status,
        notes: form.notes,
      };

      await addPathology(elderlyId, pathologyData);

      handleSuccess(t('pathology.pathologyAddedSuccessfully'));
      navigation.goBack();
    } catch (error) {
      console.error('Error adding pathology:', error);
      handleError(error, t('pathology.failedToAddPathology'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 60) + 20 }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <VStack spacing={Spacing.lg_24} style={styles.content}>
          <VStack spacing={Spacing.md_16} style={styles.form}>
            <FormTextInput
              title={t('pathology.conditionName')}
              placeholder={t('pathology.conditionNamePlaceholder')}
              value={form.name}
              onChangeText={(value) => handleInputChange('name', value)}
              required
            />

            <FormTextInput
              title={t('pathology.description')}
              placeholder={t('pathology.descriptionPlaceholder')}
              value={form.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={4}
            />

            <FormDateInput
              title={t('pathology.diagnosisDate')}
              placeholder={t('pathology.diagnosisDatePlaceholder')}
              value={form.diagnosisDate}
              onDateChange={(date) => handleInputChange('diagnosisDate', date)}
              maximumDate={new Date()}
            />

            <FormTextInput
              title={t('pathology.diagnosisSite')}
              placeholder={t('pathology.diagnosisSitePlaceholder')}
              value={form.diagnosisSite}
              onChangeText={(value) => handleInputChange('diagnosisSite', value)}
            />

            <FormDropdown
              title={t('pathology.status')}
              placeholder={t('pathology.statusPlaceholder')}
              value={form.status}
              onValueChange={(value) => handleInputChange('status', value)}
              options={pathologyStatuses}
              required
            />

            <FormTextInput
              title={t('pathology.notes')}
              placeholder={t('pathology.notesPlaceholder')}
              value={form.notes}
              onChangeText={(value) => handleInputChange('notes', value)}
              multiline
              numberOfLines={4}
            />
          </VStack>

          <VStack spacing={Spacing.md_16} style={styles.buttonContainer}>
            <PrimaryButton
              title={t('pathology.addMedicalCondition')}
              onPress={handleSubmit}
              loading={loading}
            />
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.cancelButton}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </VStack>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    ...spacingStyles.screenScrollContainer,
  },
  content: {
  },
  title: {
    fontSize: FontSize.heading3_24,
    fontFamily: FontFamily.extraBold,
    color: Color.dark,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  buttonContainer: {
    width: '100%',
    marginTop: Spacing.lg_24,
  },
  cancelButton: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v500,
    textAlign: 'center',
    paddingBottom: Spacing.lg_24,
  },
});

export default AddPathologyScreen;
