import React, { useState } from 'react';
import {
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useElderlyDetailsStore } from '@src/stores';
import { UpdatePathologyRequest, Pathology, PathologyStatus } from 'moveplus-shared';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { VStack } from '@components/CoreComponents';
import { PrimaryButton } from '@components/ButtonComponents';
import { FormTextInput } from '@components/forms/FormTextInput';
import { FormDropdown } from '@components/forms/FormDropdown';
import { useErrorHandler } from '@src/hooks/useErrorHandler';
import { useTranslation } from 'react-i18next';
import { Border } from '@styles/borders';
import { shadowStyles } from '@styles/shadow';

type EditPathologyScreenProps = NativeStackScreenProps<any, 'EditPathology'>;

interface EditPathologyScreenRouteParams {
  pathology: Pathology;
  elderlyId: number;
}

type PathologyForm = {
  description: string | null;
  status: PathologyStatus | null;
  notes: string | null;
};

const EditPathologyScreen: React.FC<EditPathologyScreenProps> = ({ route, navigation }) => {
  const { pathology, elderlyId } = route.params;
  const [loading, setLoading] = useState(false);
  const { updatePathology } = useElderlyDetailsStore();
  const { handleError, handleSuccess, handleValidationError } = useErrorHandler();
  const { t } = useTranslation();

  const [form, setForm] = useState<PathologyForm>({
    description: pathology.description || null,
    status: pathology.status || PathologyStatus.ACTIVE,
    notes: pathology.notes || null,
  });

  const statusOptions = [
    { label: t('pathology.statusOptions.active'), value: PathologyStatus.ACTIVE },
    { label: t('pathology.statusOptions.inactive'), value: PathologyStatus.INACTIVE },
    { label: t('pathology.statusOptions.chronic'), value: PathologyStatus.CHRONIC },
    { label: t('pathology.statusOptions.resolved'), value: PathologyStatus.RESOLVED },
    { label: t('pathology.statusOptions.underTreatment'), value: PathologyStatus.UNDER_TREATMENT },
    { label: t('pathology.statusOptions.monitoring'), value: PathologyStatus.MONITORING },
  ];

  const handleInputChange = (field: keyof PathologyForm, value: string | PathologyStatus) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const pathologyData: UpdatePathologyRequest = {
        description: form.description || undefined,
        status: form.status || undefined,
        notes: form.notes || undefined,
      };

      await updatePathology(elderlyId, pathology.id, pathologyData);

      handleSuccess(t('pathology.pathologyUpdatedSuccessfully'));
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update pathology:', error);
      handleError(error, t('pathology.failedToUpdatePathology'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps='handled'
      keyboardDismissMode='on-drag'
    >
      <VStack align="flex-start" spacing={Spacing.md_16}>
        {/* Read-only information */}
        <VStack align="flex-start" spacing={Spacing.sm_8} style={styles.readOnlySection}>
          <Text style={styles.readOnlyLabel}>{t('pathology.pathologyInformation')}</Text>
          <Text style={styles.readOnlyText}>{t('pathology.pathologyName')}: {pathology.name}</Text>
          {pathology.diagnosisDate && (
            <Text style={styles.readOnlyText}>{t('pathology.diagnosisDate')}: {new Date(pathology.diagnosisDate).toLocaleDateString()}</Text>
          )}
          {pathology.diagnosedAt && (
            <Text style={styles.readOnlyText}>{t('pathology.diagnosedAt')}: {pathology.diagnosedAt}</Text>
          )}
          {pathology.diagnosisSite && (
            <Text style={styles.readOnlyText}>{t('pathology.diagnosisSite')}: {pathology.diagnosisSite}</Text>
          )}
        </VStack>

        <FormTextInput
          title={t('pathology.description')}
          placeholder={t('pathology.descriptionPlaceholder')}
          value={form.description || ''}
          onChangeText={(value) => handleInputChange('description', value)}
          multiline
        />

        <FormDropdown
          title={t('pathology.status')}
          placeholder={t('pathology.selectStatus')}
          value={form.status}
          onValueChange={(value) => handleInputChange('status', value as PathologyStatus)}
          options={statusOptions}
        />

        <FormTextInput
          title={t('pathology.notes')}
          placeholder={t('pathology.additionalNotesPlaceholder')}
          value={form.notes || ''}
          onChangeText={(value) => handleInputChange('notes', value)}
          multiline
        />

        <PrimaryButton
          title={loading ? t('pathology.updating') : t('pathology.updatePathology')}
          onPress={handleSubmit}
          style={styles.submitButton}
        />
      </VStack>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  contentContainer: {
    ...spacingStyles.screenScrollContainer,
  },
  title: {
    fontSize: FontSize.heading1_32,
    fontFamily: FontFamily.bold,
    color: Color.dark,
    textAlign: 'center',
    marginBottom: Spacing.md_16,
  },
  readOnlySection: {
    backgroundColor: Color.Background.white,
    borderRadius: Border.sm_8,
    padding: Spacing.md_16,
    marginBottom: Spacing.sm_8,
    alignSelf: 'stretch',
    ...shadowStyles.cardShadow
  },
  readOnlyLabel: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
    marginBottom: Spacing.xs_4,
  },
  readOnlyText: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
    marginBottom: Spacing.xxs_2,
  },
  submitButton: {
    marginTop: Spacing.lg_24,
  },
});

export default EditPathologyScreen;
